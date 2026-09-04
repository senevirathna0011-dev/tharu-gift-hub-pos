'use client';

import React, { useState, useEffect } from 'react';
import { DashboardStats } from '@/lib/types';
import { formatDate } from '@/lib/formatters';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Package, 
  AlertTriangle, 
  Award, 
  Sparkles, 
  Gift, 
  ShieldAlert,
  Eye,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsPage() {
  const { formatMoney } = useSettings();
  const { isAdmin, openSwitchModal } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/analytics');
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-stone-200 shadow-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 font-display">Administrator Access Required</h2>
        <p className="text-xs text-stone-500 mt-2 mb-6">
          Store revenue analytics, margins, and profit reports are restricted to administrators.
        </p>
        <button
          onClick={openSwitchModal}
          className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-600/25 transition-all font-display"
        >
          Switch to Admin Shift
        </button>
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-stone-500">Loading boutique analytics...</p>
      </div>
    );
  }

  const maxSoldQty = Math.max(
    ...stats.topSellingProducts.map((p) => p.totalQuantity),
    1
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 font-display tracking-tight flex items-center gap-2">
          <span>Boutique Performance & Analytics</span>
          <Sparkles className="w-5 h-5 text-pink-500" />
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Daily sales trends, best-selling gift items, catalog traffic, inventory asset valuation, and stock alerts.
        </p>
      </div>

      {/* KPI Cards (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Today's Revenue */}
        <div className="p-5 bg-white rounded-3xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Today&apos;s Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-stone-900 font-display">
              {formatMoney(stats.todayRevenue)}
            </div>
            <p className="text-xs text-stone-400 mt-1">From {stats.todaySalesCount} transactions today</p>
          </div>
        </div>

        {/* Units Sold Today */}
        <div className="p-5 bg-white rounded-3xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Units Sold Today</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-stone-900 font-display">
              {stats.todayItemsSold}
            </div>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Active POS Checkout</span>
            </p>
          </div>
        </div>

        {/* Total Catalog Views (Live Web Traffic Counter) */}
        <div className="p-5 bg-white rounded-3xl border border-blue-100 shadow-xs">
          <div className="flex items-center justify-between text-blue-700">
            <span className="text-xs font-bold uppercase tracking-wider">Catalog Views</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-stone-900 font-display">
              {(stats.totalCatalogViews || 0).toLocaleString()}
            </div>
            <Link
              href="/catalog"
              target="_blank"
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold mt-1 inline-flex items-center gap-1 hover:underline"
            >
              <span>Live Store Traffic</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Inventory Asset Value */}
        <div className="p-5 bg-white rounded-3xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Inventory Value</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-stone-900 font-display">
              {formatMoney(stats.totalInventoryValue)}
            </div>
            <p className="text-xs text-stone-400 mt-1">Across {stats.totalProductsCount} SKUs</p>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="p-5 bg-white rounded-3xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-bold uppercase tracking-wider">Low Stock Items</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-950 font-display">
              {stats.lowStockCount}
            </div>
            <Link
              href="/inventory"
              className="text-xs text-amber-700 hover:underline font-semibold mt-1 inline-block"
            >
              Restock in Inventory &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Top Selling Products & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Selling Products (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-stone-900 text-base font-display">
                Top Selling Gift Items
              </h3>
            </div>
            <span className="text-xs text-stone-400">All-time volume</span>
          </div>

          {stats.topSellingProducts.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <Gift className="w-8 h-8 mx-auto mb-2 text-stone-300" />
              <p className="text-xs">No sales data recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.topSellingProducts.map((p, idx) => {
                const pct = Math.round((p.totalQuantity / maxSoldQty) * 100);

                return (
                  <div key={p.productSku} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-[10px]">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-stone-900">{p.productName}</span>
                        <span className="font-mono text-stone-400 text-[11px]">({p.productSku})</span>
                      </div>
                      <div className="font-bold text-stone-900 font-display">
                        {p.totalQuantity} sold ({formatMoney(p.totalRevenue)})
                      </div>
                    </div>
                    {/* Visual Bar */}
                    <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-pink-500 to-rose-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Transactions (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-900 text-base font-display">
                Recent Transactions
              </h3>
              <Link
                href="/sales"
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
              >
                View all &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {stats.recentSales.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-100 text-xs"
                >
                  <div>
                    <div className="font-mono font-bold text-stone-900">{s.receiptNo}</div>
                    <div className="text-[11px] text-stone-500">{formatDate(s.createdAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-stone-900 font-display">
                      {formatMoney(s.totalAmount)}
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700">
                      {s.paymentMethod}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Store Status: Open</span>
            <span className="font-mono">POS Terminal v1.1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
