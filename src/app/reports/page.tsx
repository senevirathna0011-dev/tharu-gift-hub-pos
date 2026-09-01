'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SalesReportStats, ReportDateFilter, Sale } from '@/lib/types';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import ReceiptModal from '@/components/receipt/ReceiptModal';
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Receipt, 
  ShoppingBag, 
  Calendar, 
  Printer, 
  RefreshCw, 
  Banknote, 
  CreditCard, 
  Smartphone, 
  Award,
  Layers,
  Sparkles,
  ArrowUpRight,
  Filter,
  Gift
} from 'lucide-react';

export default function ReportsPage() {
  const { formatMoney, settings } = useSettings();
  const { isAdmin, isLoading: authLoading, currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [dateFilter, setDateFilter] = useState<ReportDateFilter>('today');
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  const [reportStats, setReportStats] = useState<SalesReportStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedSaleForReprint, setSelectedSaleForReprint] = useState<Sale | null>(null);

  // Role Guard
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/pos');
    }
  }, [authLoading, isAdmin, router]);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set('filter', dateFilter);
      if (dateFilter === 'custom') {
        params.set('startDate', customStartDate);
        params.set('endDate', customEndDate);
      }

      const res = await fetch(`/api/reports?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.stats) {
        setReportStats(data.stats);
      } else {
        toast(data.error || 'Failed to fetch sales report', 'error');
      }
    } catch (err) {
      toast('Network error loading sales report', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, customStartDate, customEndDate, toast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handlePrintSummary = () => {
    window.print();
  };

  const today = reportStats?.todaySummary;

  if (authLoading) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header (Hidden during Print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 font-display tracking-tight flex items-center gap-2">
            <span>Sales & Profit Reports</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 font-bold">
              Real-time Analytics
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Track daily boutique revenue, gross margins, payment methods, and itemized sales.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchReports}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors shadow-2xs"
            title="Refresh Report Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-pink-600' : ''}`} />
          </button>

          <button
            onClick={handlePrintSummary}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all font-display"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* DATE FILTER CONTROLS (Hidden during Print) */}
      <div className="no-print bg-white rounded-3xl border border-stone-200 p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-pink-600" />
          <span className="text-xs font-bold text-stone-800">Filter Period:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {(
            [
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'custom', label: 'Custom Range' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setDateFilter(t.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                dateFilter === t.id
                  ? 'bg-rose-600 text-white shadow-xs shadow-rose-600/20'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers */}
        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-stone-50 rounded-xl border border-stone-200 text-xs font-mono"
            />
            <span className="text-xs text-stone-400">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-stone-50 rounded-xl border border-stone-200 text-xs font-mono"
            />
            <button
              onClick={fetchReports}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold rounded-xl"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* PRINTABLE REPORT CONTAINER (Always Visible in Print via #report-print-area) */}
      <div id="report-print-area" className="space-y-6">
        {/* Printable Header (Visible in print or clean view) */}
        <div className="hidden print:block border-b-2 border-stone-800 pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black font-display text-stone-900 uppercase tracking-tight">
                {settings.shopName || 'Tharu Gift Hub'}
              </h1>
              <p className="text-xs text-stone-600">{settings.address} • Tel: {settings.phone}</p>
              <h2 className="text-sm font-bold text-rose-700 mt-2 font-display uppercase tracking-wider">
                Sales & Profit Analytics Report
              </h2>
            </div>
            <div className="text-right text-xs space-y-1">
              <div><strong>Generated:</strong> {new Date().toLocaleString()}</div>
              <div><strong>Generated By:</strong> {currentUser?.name || 'Administrator'}</div>
              <div><strong>Filter:</strong> {dateFilter.toUpperCase()}</div>
            </div>
          </div>
        </div>

        {/* TODAY'S REAL-TIME SUMMARY BANNER */}
        {today && (
          <div className="p-5 rounded-3xl bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white shadow-xl border border-stone-800 space-y-4 print:bg-white print:text-black print:border-stone-300 print:shadow-none">
            <div className="flex items-center justify-between border-b border-stone-700/60 print:border-stone-300 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse print:hidden" />
                <h2 className="text-sm font-bold font-display uppercase tracking-wider text-pink-300 print:text-black">
                  Today's Business Summary ({new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                </h2>
              </div>
              <span className="text-xs font-mono text-stone-400 print:text-stone-600">Live Register Status</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
              <div>
                <span className="text-xs text-stone-400 print:text-stone-600 font-medium">Today's Sales Revenue</span>
                <div className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white print:text-black mt-0.5">
                  {formatMoney(today.revenue)}
                </div>
              </div>

              <div>
                <span className="text-xs text-emerald-400 print:text-stone-700 font-medium">Gross Profit (Est.)</span>
                <div className="text-2xl sm:text-3xl font-black font-display tracking-tight text-emerald-400 print:text-black mt-0.5">
                  {formatMoney(today.profit)}
                </div>
              </div>

              <div>
                <span className="text-xs text-stone-400 print:text-stone-600 font-medium">Completed Sales</span>
                <div className="text-2xl sm:text-3xl font-black font-display tracking-tight text-pink-200 print:text-black mt-0.5">
                  {today.salesCount} Orders
                </div>
              </div>

              <div>
                <span className="text-xs text-stone-400 print:text-stone-600 font-medium">Gift Units Sold</span>
                <div className="text-2xl sm:text-3xl font-black font-display tracking-tight text-amber-300 print:text-black mt-0.5">
                  {today.itemsSold} units
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FILTERED PERIOD STATS CARDS */}
        {reportStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between print:border-stone-300">
              <div>
                <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">
                  Filtered Sales Total
                </span>
                <div className="text-2xl font-black text-stone-900 font-display mt-0.5">
                  {formatMoney(reportStats.totalRevenue)}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center print:hidden">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between print:border-stone-300">
              <div>
                <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">
                  Filtered Total Profit
                </span>
                <div className="text-2xl font-black text-emerald-600 print:text-black font-display mt-0.5">
                  {formatMoney(reportStats.totalProfit)}
                </div>
                <span className="text-[10px] text-emerald-700 font-bold">
                  Margin: {reportStats.profitMarginPercent}%
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center print:hidden">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between print:border-stone-300">
              <div>
                <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">
                  Orders & Avg Order Value
                </span>
                <div className="text-2xl font-black text-stone-900 font-display mt-0.5">
                  {reportStats.totalTransactionsCount}
                </div>
                <span className="text-[10px] text-stone-500 font-mono">
                  AOV: {formatMoney(reportStats.averageOrderValue)}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center print:hidden">
                <Receipt className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between print:border-stone-300">
              <div>
                <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">
                  Total Units Sold
                </span>
                <div className="text-2xl font-black text-stone-900 font-display mt-0.5">
                  {reportStats.totalUnitsSold}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center print:hidden">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}

        {/* PAYMENT METHOD BREAKDOWN & TOP PRODUCTS */}
        {reportStats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment Method Cards */}
            <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs space-y-4 print:border-stone-300">
              <h3 className="text-sm font-bold text-stone-900 font-display flex items-center gap-2">
                <Banknote className="w-4 h-4 text-pink-600 print:hidden" />
                <span>Payment Methods</span>
              </h3>

              <div className="space-y-3 text-xs">
                {/* Cash */}
                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between print:bg-white print:border-stone-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center print:hidden">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-stone-900">Cash Payments</span>
                      <p className="text-[11px] text-stone-500">{reportStats.paymentMethods.cashCount} transactions</p>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-stone-900">
                    {formatMoney(reportStats.paymentMethods.cashRevenue)}
                  </div>
                </div>

                {/* Card */}
                <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between print:bg-white print:border-stone-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center print:hidden">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-stone-900">Card / POS</span>
                      <p className="text-[11px] text-stone-500">{reportStats.paymentMethods.cardCount} transactions</p>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-stone-900">
                    {formatMoney(reportStats.paymentMethods.cardRevenue)}
                  </div>
                </div>

                {/* Digital */}
                <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between print:bg-white print:border-stone-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center print:hidden">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-stone-900">Digital / QR</span>
                      <p className="text-[11px] text-stone-500">{reportStats.paymentMethods.digitalCount} transactions</p>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-stone-900">
                    {formatMoney(reportStats.paymentMethods.digitalRevenue)}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Selling Products */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 p-5 shadow-xs space-y-3 print:border-stone-300">
              <h3 className="text-sm font-bold text-stone-900 font-display flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-600 print:hidden" />
                <span>Top Performing Products</span>
              </h3>

              {reportStats.topProducts.length === 0 ? (
                <p className="text-xs text-stone-400 py-6 text-center">No product sales in this period</p>
              ) : (
                <div className="divide-y divide-stone-100 text-xs">
                  {reportStats.topProducts.slice(0, 5).map((p, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-5 text-center font-bold text-stone-400 font-mono text-xs">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-stone-900 truncate">{p.productName}</div>
                          <div className="text-[11px] text-stone-400 font-mono">{p.productSku}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right shrink-0">
                        <div>
                          <span className="font-bold font-mono text-stone-900">{p.totalQuantity} sold</span>
                          <div className="text-[10px] text-stone-500 font-mono">Revenue: {formatMoney(p.totalRevenue)}</div>
                        </div>
                        <div className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-mono font-bold text-xs print:bg-white print:text-black">
                          +{formatMoney(p.totalProfit)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FILTERED TRANSACTIONS TABLE */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden print:border-stone-300">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50 print:bg-white">
            <div>
              <h3 className="font-bold text-stone-900 text-base font-display">
                Transaction Details & Profit Breakdown
              </h3>
              <p className="text-xs text-stone-500">
                Itemized sales ledger with cost and profit calculations
              </p>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-700 font-bold">
              {reportStats?.sales.length || 0} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-bold text-stone-500 uppercase tracking-wider print:bg-stone-100 print:text-black">
                  <th className="py-3.5 px-4 sm:px-6">Receipt #</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4 text-right">Revenue</th>
                  <th className="py-3.5 px-4 text-right">Cost</th>
                  <th className="py-3.5 px-4 text-right">Profit</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right no-print">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {!reportStats || reportStats.sales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-stone-400">
                      <Receipt className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                      <p className="font-semibold text-stone-700">No transactions recorded for this period</p>
                      <p className="text-xs text-stone-400 mt-0.5">Try selecting another date range or filter.</p>
                    </td>
                  </tr>
                ) : (
                  reportStats.sales.map((sale) => (
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
                      <td className="py-3.5 px-4 font-medium text-stone-800">
                        {sale.customer ? (
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-stone-900">{sale.customer.name}</span>
                            <span className="text-[10px] text-stone-400">({sale.customer.phone})</span>
                          </div>
                        ) : (
                          sale.customerName || 'Walk-in Customer'
                        )}
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-stone-100 font-semibold text-[10px] text-stone-700">
                          {sale.paymentMethod}
                        </span>
                      </td>

                      {/* Revenue */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-stone-900">
                        {formatMoney(sale.totalAmount)}
                      </td>

                      {/* Cost */}
                      <td className="py-3.5 px-4 text-right font-mono text-stone-500">
                        {formatMoney(sale.costAmount ?? 0)}
                      </td>

                      {/* Profit */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 print:text-black">
                        +{formatMoney(sale.profitAmount ?? 0)}
                      </td>

                      {/* Action (Hidden during Print) */}
                      <td className="py-3.5 px-4 sm:px-6 text-right no-print">
                        <button
                          onClick={() => setSelectedSaleForReprint(sale)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-rose-50 hover:text-rose-600 text-stone-700 text-xs font-semibold transition-colors shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedSaleForReprint}
        sale={selectedSaleForReprint}
        onClose={() => setSelectedSaleForReprint(null)}
      />
    </div>
  );
}
