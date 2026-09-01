'use client';

import React from 'react';
import { useSettings } from '@/context/SettingsContext';
import { 
  Package, 
  DollarSign, 
  AlertTriangle, 
  PackageX, 
  TrendingUp 
} from 'lucide-react';

interface StockStatsCardsProps {
  totalProducts: number;
  totalInventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  onFilterLowStock: () => void;
  onFilterOutOfStock: () => void;
  onFilterAll: () => void;
}

export default function StockStatsCards({
  totalProducts,
  totalInventoryValue,
  lowStockCount,
  outOfStockCount,
  onFilterLowStock,
  onFilterOutOfStock,
  onFilterAll,
}: StockStatsCardsProps) {
  const { formatMoney } = useSettings();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total SKUs */}
      <button
        onClick={onFilterAll}
        className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-pink-300 hover:shadow-md transition-all text-left group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Total Gift SKUs
          </span>
          <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Package className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-stone-900 font-display">
            {totalProducts}
          </div>
          <p className="text-xs text-stone-400 mt-0.5">Active catalog inventory</p>
        </div>
      </button>

      {/* Total Inventory Value */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs text-left">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Inventory Cost Value
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-stone-900 font-display">
            {formatMoney(totalInventoryValue)}
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Asset Valuation</span>
          </p>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <button
        onClick={onFilterLowStock}
        className="p-5 rounded-2xl bg-white border border-amber-200 shadow-xs hover:border-amber-400 hover:shadow-md transition-all text-left group relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
            Low Stock Alerts
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-amber-900 font-display">
            {lowStockCount}
          </div>
          <p className="text-xs text-amber-600 font-medium mt-0.5">
            {lowStockCount > 0 ? 'Action needed: restock soon' : 'All stock levels healthy'}
          </p>
        </div>
      </button>

      {/* Out of Stock */}
      <button
        onClick={onFilterOutOfStock}
        className="p-5 rounded-2xl bg-white border border-rose-200 shadow-xs hover:border-rose-400 hover:shadow-md transition-all text-left group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
            Out of Stock
          </span>
          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <PackageX className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-rose-900 font-display">
            {outOfStockCount}
          </div>
          <p className="text-xs text-rose-600 font-medium mt-0.5">
            {outOfStockCount > 0 ? 'Unavailable in POS checkout' : 'Zero items depleted'}
          </p>
        </div>
      </button>
    </div>
  );
}
