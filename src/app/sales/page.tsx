'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sale } from '@/lib/types';
import { formatDate } from '@/lib/formatters';
import { useSettings } from '@/context/SettingsContext';
import ReceiptModal from '@/components/receipt/ReceiptModal';
import SalesReturnModal from '@/components/pos/SalesReturnModal';
import { useToast } from '@/components/ui/Toast';
import { 
  Receipt, 
  Search, 
  Printer, 
  DollarSign, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  RefreshCw, 
  Gift, 
  User,
  RotateCcw,
  Phone
} from 'lucide-react';

export default function SalesPage() {
  const { formatMoney } = useSettings();
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('All');
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);

  // Return modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState<boolean>(false);
  const [returnReceiptNo, setReturnReceiptNo] = useState<string | null>(null);

  const fetchSales = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (paymentFilter !== 'All') params.set('paymentMethod', paymentFilter);

      const res = await fetch(`/api/sales?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSales(data.sales);
      } else {
        toast(data.error || 'Failed to fetch sales history', 'error');
      }
    } catch (err) {
      toast('Network error loading sales', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, paymentFilter, toast]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Aggregate stats
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalItemsCount = sales.reduce(
    (sum, s) => sum + s.items.reduce((iSum, i) => iSum + i.quantity, 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 font-display tracking-tight flex items-center gap-2">
            <span>Sales & Receipts History</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 font-bold">
              {sales.length} Transactions
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Audit store sales, issue customer returns & refunds, and reprint 80mm thermal bills.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={fetchSales}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-pink-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              setReturnReceiptNo(null);
              setIsReturnModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 font-display"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sales Return / Refund</span>
          </button>
        </div>
      </div>

      {/* Summary KPI mini cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="text-2xl font-black text-stone-900 font-display mt-0.5">
              {formatMoney(totalRevenue)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">
              Completed Orders
            </span>
            <div className="text-2xl font-black text-stone-900 font-display mt-0.5">
              {sales.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">
              Total Gift Units Sold
            </span>
            <div className="text-2xl font-black text-stone-900 font-display mt-0.5">
              {totalItemsCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Gift className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-3xl border border-stone-200 p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Receipt #, Customer, or Cashier..."
            className="w-full pl-10 pr-4 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-medium focus:outline-hidden focus:border-rose-500"
          />
        </div>

        {/* Payment Method filter */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl text-xs font-semibold w-full md:w-auto overflow-x-auto">
          {['All', 'CASH', 'CARD', 'DIGITAL'].map((m) => (
            <button
              key={m}
              onClick={() => setPaymentFilter(m)}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                paymentFilter === m
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {m === 'All' ? 'All Payments' : m}
            </button>
          ))}
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Receipt #</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Cashier</th>
                <th className="py-3.5 px-4">Items Summary</th>
                <th className="py-3.5 px-4 text-center">Payment</th>
                <th className="py-3.5 px-4 text-right">Grand Total</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                    <p className="font-semibold text-stone-700">No transactions found</p>
                    <p className="text-xs text-stone-400 mt-0.5">Complete a sale in POS to see records here.</p>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => {
                  const itemsCount = sale.items.reduce((s, i) => s + i.quantity, 0);

                  return (
                    <tr key={sale.id} className="hover:bg-stone-50/80 transition-colors">
                      {/* Receipt No */}
                      <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-stone-900">
                        {sale.receiptNo}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-stone-500">
                        {formatDate(sale.createdAt)}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-stone-800">
                          {sale.customerName || 'Walk-in Customer'}
                        </div>
                        {(sale.customerPhone || sale.customer?.phone) && (
                          <div className="text-[10px] text-stone-500 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5 text-stone-400" />
                            <span>{sale.customerPhone || sale.customer?.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Cashier */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-stone-100 font-semibold text-stone-700 text-[11px]">
                          <User className="w-3 h-3 text-stone-400" />
                          <span>{sale.cashierName || 'Cashier'}</span>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4">
                        <div className="text-stone-700 font-medium">
                          {itemsCount} item{itemsCount > 1 ? 's' : ''}
                        </div>
                        <div className="text-[10px] text-stone-400 line-clamp-1">
                          {sale.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                        </div>
                      </td>

                      {/* Payment Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            sale.paymentMethod === 'CASH'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sale.paymentMethod === 'CARD'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {sale.paymentMethod === 'CASH' && <Banknote className="w-3 h-3" />}
                          {sale.paymentMethod === 'CARD' && <CreditCard className="w-3 h-3" />}
                          {sale.paymentMethod === 'DIGITAL' && <Smartphone className="w-3 h-3" />}
                          <span>{sale.paymentMethod}</span>
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-stone-900 text-sm">
                        {formatMoney(sale.totalAmount)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setReturnReceiptNo(sale.receiptNo);
                              setIsReturnModalOpen(true);
                            }}
                            title="Process Return / Refund for this sale"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors shadow-2xs"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Return</span>
                          </button>

                          <button
                            onClick={() => setSelectedSaleForReceipt(sale)}
                            title="Reprint 80mm bill"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors shadow-2xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Bill</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedSaleForReceipt}
        sale={selectedSaleForReceipt}
        onClose={() => setSelectedSaleForReceipt(null)}
      />

      {/* Sales Return / Refund Modal */}
      <SalesReturnModal
        isOpen={isReturnModalOpen}
        initialReceiptNo={returnReceiptNo}
        onClose={() => {
          setIsReturnModalOpen(false);
          setReturnReceiptNo(null);
        }}
        onReturnProcessed={() => {
          fetchSales();
        }}
      />
    </div>
  );
}
