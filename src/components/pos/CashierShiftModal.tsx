'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { CashierShiftStats, Sale } from '@/lib/types';
import { formatDate, formatShortDate } from '@/lib/formatters';
import { 
  X, 
  DollarSign, 
  Receipt, 
  ShoppingBag, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  RefreshCw, 
  User, 
  Clock, 
  Calendar,
  Sparkles,
  Printer,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import ReceiptModal from '@/components/receipt/ReceiptModal';

interface CashierShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CashierShiftModal({ isOpen, onClose }: CashierShiftModalProps) {
  const { currentUser } = useAuth();
  const { formatMoney, settings } = useSettings();

  const [stats, setStats] = useState<CashierShiftStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const fetchShiftStats = useCallback(async () => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      setErrorMsg('');
      const params = new URLSearchParams();
      if (currentUser.id) params.set('cashierId', currentUser.id);
      if (currentUser.name) params.set('cashierName', currentUser.name);

      const res = await fetch(`/api/sales/shift?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      } else {
        setErrorMsg(data.error || 'Failed to load shift stats');
      }
    } catch (err) {
      setErrorMsg('Network error loading shift data');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen) {
      fetchShiftStats();
    }
  }, [isOpen, fetchShiftStats]);

  const handlePrintXReport = () => {
    window.print();
  };

  if (!isOpen) return null;

  const totalSales = stats?.totalSalesAmount || 0;
  const cashAmount = stats?.paymentBreakdown.cash.amount || 0;
  const cardAmount = stats?.paymentBreakdown.card.amount || 0;
  const digitalAmount = (stats?.paymentBreakdown.digital.amount || 0) + (stats?.paymentBreakdown.credit.amount || 0);

  const cashPercent = totalSales > 0 ? ((cashAmount / totalSales) * 100).toFixed(0) : '0';
  const cardPercent = totalSales > 0 ? ((cardAmount / totalSales) * 100).toFixed(0) : '0';
  const digitalPercent = totalSales > 0 ? ((digitalAmount / totalSales) * 100).toFixed(0) : '0';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
        <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-md shadow-pink-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-stone-900 text-base font-display">
                    My Shift & Today&apos;s Sales Summary
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-pink-100 text-pink-700 font-mono text-[10px] font-bold">
                    {settings.currencyCode || 'LKR'}
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Sales stats for active cashier: <strong className="text-stone-800">{currentUser?.name}</strong> (Today only)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchShiftStats}
                disabled={isLoading}
                title="Refresh shift stats"
                className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-pink-600' : ''}`} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-5">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Cashier Shift Identity Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-stone-900 to-stone-800 text-white gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-sm text-pink-300 font-display">
                  {currentUser?.name ? currentUser.name.charAt(0) : 'C'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm font-display">{currentUser?.name}</span>
                    <span className="px-1.5 py-0.2 rounded bg-pink-500/30 text-pink-200 text-[10px] font-mono font-bold">
                      {currentUser?.role || 'CASHIER'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-300 font-mono mt-0.5">
                    Terminal ID: @{currentUser?.username || 'active'}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10">
                <span className="text-[10px] text-stone-400 uppercase tracking-wider block">
                  Today&apos;s Shift Date
                </span>
                <span className="text-xs font-bold text-white font-mono flex items-center gap-1 sm:justify-end">
                  <Calendar className="w-3.5 h-3.5 text-pink-400" />
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Top 3 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Total Sales */}
              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 flex flex-col justify-between shadow-2xs">
                <div className="flex items-center justify-between text-rose-700 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Sales</span>
                  <DollarSign className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black text-rose-950 font-display">
                  {formatMoney(totalSales)}
                </div>
                <p className="text-[10px] text-rose-600 mt-1 font-medium">
                  {stats?.totalItemsSold || 0} total units sold today
                </p>
              </div>

              {/* Total Transactions */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between shadow-2xs">
                <div className="flex items-center justify-between text-emerald-700 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Transactions</span>
                  <Receipt className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black text-emerald-950 font-display">
                  {stats?.totalTransactionsCount || 0}
                </div>
                <p className="text-[10px] text-emerald-600 mt-1 font-medium">
                  Completed orders today
                </p>
              </div>

              {/* Average Order Value */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex flex-col justify-between shadow-2xs">
                <div className="flex items-center justify-between text-purple-700 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Avg. Ticket Size</span>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black text-purple-950 font-display">
                  {formatMoney(
                    stats && stats.totalTransactionsCount > 0
                      ? +(totalSales / stats.totalTransactionsCount).toFixed(2)
                      : 0
                  )}
                </div>
                <p className="text-[10px] text-purple-600 mt-1 font-medium">
                  Average amount per customer
                </p>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Payment Breakdown</span>
                </h4>
                <span className="text-[11px] text-stone-500 font-mono">
                  {stats?.totalTransactionsCount || 0} Total Payments
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Cash */}
                <div className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-2xs">
                  <div className="flex items-center justify-between text-emerald-700 mb-1">
                    <span className="text-xs font-bold flex items-center gap-1">
                      <Banknote className="w-3.5 h-3.5" />
                      <span>Cash</span>
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                      {cashPercent}%
                    </span>
                  </div>
                  <div className="text-lg font-black text-stone-900 font-display">
                    {formatMoney(cashAmount)}
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                    {stats?.paymentBreakdown.cash.count || 0} bills
                  </div>
                </div>

                {/* Card */}
                <div className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-2xs">
                  <div className="flex items-center justify-between text-blue-700 mb-1">
                    <span className="text-xs font-bold flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Card</span>
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                      {cardPercent}%
                    </span>
                  </div>
                  <div className="text-lg font-black text-stone-900 font-display">
                    {formatMoney(cardAmount)}
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                    {stats?.paymentBreakdown.card.count || 0} bills
                  </div>
                </div>

                {/* Digital / Credit */}
                <div className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-2xs">
                  <div className="flex items-center justify-between text-purple-700 mb-1">
                    <span className="text-xs font-bold flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Digital / Credit</span>
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                      {digitalPercent}%
                    </span>
                  </div>
                  <div className="text-lg font-black text-stone-900 font-display">
                    {formatMoney(digitalAmount)}
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                    {(stats?.paymentBreakdown.digital.count || 0) + (stats?.paymentBreakdown.credit.count || 0)} bills
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Transactions by this Cashier */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Today&apos;s Completed Bills ({stats?.sales.length || 0})
                </h4>
                <span className="text-[11px] text-stone-400">Click a bill to preview/reprint</span>
              </div>

              <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-2xs divide-y divide-stone-100 max-h-56 overflow-y-auto">
                {!stats || stats.sales.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <ShoppingBag className="w-6 h-6 mx-auto mb-1 text-stone-300" />
                    <p className="text-xs font-semibold text-stone-700">No sales recorded yet today</p>
                    <p className="text-[11px] text-stone-400">Ring up an order in the POS terminal to populate shift records.</p>
                  </div>
                ) : (
                  stats.sales.map((sale) => (
                    <button
                      type="button"
                      key={sale.id}
                      onClick={() => setSelectedSale(sale)}
                      className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-rose-50/40 transition-colors text-left group"
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center font-mono text-[10px] font-bold text-stone-700 shrink-0">
                          #{sale.receiptNo.slice(-4)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-stone-900 truncate group-hover:text-rose-600 transition-colors">
                            {sale.receiptNo}
                          </div>
                          <div className="text-[10px] text-stone-400 font-mono">
                            {formatShortDate(sale.createdAt)} • {sale.customerName || 'Walk-in Customer'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            sale.paymentMethod === 'CASH'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sale.paymentMethod === 'CARD'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {sale.paymentMethod}
                        </span>

                        <div className="text-right">
                          <div className="text-xs font-bold text-stone-900 font-display">
                            {formatMoney(sale.totalAmount)}
                          </div>
                        </div>

                        <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-rose-600 transition-colors" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-3">
            <span className="text-[11px] text-stone-500 font-mono hidden sm:inline">
              Cashier Shift Summary Report
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 font-semibold text-xs transition-colors flex-1 sm:flex-none font-display"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Receipt Modal when clicking on a transaction */}
      <ReceiptModal
        isOpen={!!selectedSale}
        sale={selectedSale}
        onClose={() => setSelectedSale(null)}
      />
    </>
  );
}
