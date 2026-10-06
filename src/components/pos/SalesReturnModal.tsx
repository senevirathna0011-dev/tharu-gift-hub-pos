'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useToast } from '@/components/ui/Toast';
import { Sale, SalesReturn } from '@/lib/types';
import { formatDate } from '@/lib/formatters';
import ReturnReceiptModal from '@/components/receipt/ReturnReceiptModal';
import confetti from 'canvas-confetti';
import { 
  X, 
  Search, 
  RotateCcw, 
  Receipt, 
  AlertCircle, 
  Plus, 
  Minus, 
  Check, 
  ArrowRight, 
  Loader2, 
  Banknote, 
  CreditCard, 
  FileText,
  Boxes,
  User,
  Clock
} from 'lucide-react';

interface SalesReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReceiptNo?: string | null;
  onReturnProcessed?: () => void;
}

interface ReturnItemSelection {
  productId: string | null;
  productName: string;
  productSku: string;
  originalQty: number;
  alreadyReturned: number;
  remainingReturnable: number;
  returnQty: number;
  unitPrice: number;
  subtotal: number;
  reason: string;
}

const RETURN_REASONS = [
  'Customer Changed Mind',
  'Defective / Damaged Item',
  'Wrong Size / Item Chosen',
  'Gift Exchange',
  'Quality Not Satisfactory',
  'Other Reason',
];

export default function SalesReturnModal({
  isOpen,
  onClose,
  initialReceiptNo,
  onReturnProcessed,
}: SalesReturnModalProps) {
  const { currentUser } = useAuth();
  const { settings, formatMoney } = useSettings();
  const { toast } = useToast();

  const [receiptQuery, setReceiptQuery] = useState('');
  const [isLoadingSale, setIsLoadingSale] = useState(false);
  const [saleData, setSaleData] = useState<any | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItemSelection[]>([]);
  const [generalReason, setGeneralReason] = useState(RETURN_REASONS[0]);
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'CARD' | 'CREDIT_NOTE'>('CASH');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Generated return voucher state
  const [processedReturn, setProcessedReturn] = useState<SalesReturn | null>(null);
  const [isReturnReceiptOpen, setIsReturnReceiptOpen] = useState(false);

  const handleLookupReceipt = useCallback(async (receiptNoToSearch: string) => {
    const cleanNo = receiptNoToSearch.trim();
    if (!cleanNo) {
      setErrorMsg('Please enter or scan a Receipt Number');
      return;
    }

    try {
      setIsLoadingSale(true);
      setErrorMsg('');
      const res = await fetch(`/api/sales/lookup?receiptNo=${encodeURIComponent(cleanNo)}`);
      const data = await res.json();

      if (data.success && data.sale) {
        setSaleData(data.sale);
        // Initialize return item selections
        const itemsList: ReturnItemSelection[] = data.sale.items.map((item: any) => ({
          productId: item.productId || null,
          productName: item.productName,
          productSku: item.productSku,
          originalQty: item.quantity,
          alreadyReturned: item.alreadyReturned || 0,
          remainingReturnable: item.remainingReturnable !== undefined ? item.remainingReturnable : item.quantity,
          returnQty: 0,
          unitPrice: item.unitPrice,
          subtotal: 0,
          reason: RETURN_REASONS[0],
        }));

        setReturnItems(itemsList);
      } else {
        setErrorMsg(data.error || `No receipt found for "${cleanNo}"`);
        setSaleData(null);
        setReturnItems([]);
      }
    } catch (err) {
      setErrorMsg('Network error searching receipt');
      setSaleData(null);
    } finally {
      setIsLoadingSale(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialReceiptNo) {
        setReceiptQuery(initialReceiptNo);
        handleLookupReceipt(initialReceiptNo);
      } else {
        setReceiptQuery('');
        setSaleData(null);
        setReturnItems([]);
        setErrorMsg('');
      }
      setGeneralReason(RETURN_REASONS[0]);
      setRefundMethod('CASH');
      setNotes('');
      setIsProcessing(false);
      setProcessedReturn(null);
    }
  }, [isOpen, initialReceiptNo, handleLookupReceipt]);

  const handleUpdateItemReturnQty = (index: number, newQty: number) => {
    setReturnItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const clampedQty = Math.max(0, Math.min(newQty, item.remainingReturnable));
        return {
          ...item,
          returnQty: clampedQty,
          subtotal: +(clampedQty * item.unitPrice).toFixed(2),
        };
      })
    );
  };

  const handleUpdateItemReason = (index: number, newReason: string) => {
    setReturnItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, reason: newReason } : item))
    );
  };

  // Financial calculations
  const totalReturnQty = returnItems.reduce((sum, item) => sum + item.returnQty, 0);
  const totalRefundAmount = +returnItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2);

  const handleProcessReturn = async () => {
    if (!saleData) return;
    if (totalReturnQty <= 0) {
      toast('Select at least 1 item to return', 'error');
      return;
    }

    const itemsToSubmit = returnItems
      .filter((i) => i.returnQty > 0)
      .map((i) => ({
        productId: i.productId,
        productName: i.productName,
        productSku: i.productSku,
        quantity: i.returnQty,
        unitPrice: i.unitPrice,
        reason: i.reason,
      }));

    try {
      setIsProcessing(true);
      setErrorMsg('');

      const payload = {
        saleId: saleData.id,
        receiptNo: saleData.receiptNo,
        customerId: saleData.customerId || null,
        customerName: saleData.customerName || 'Walk-in Customer',
        cashierId: currentUser?.id || null,
        cashierName: currentUser?.name || 'Cashier',
        refundAmount: totalRefundAmount,
        refundMethod,
        reason: generalReason,
        notes,
        items: itemsToSubmit,
      };

      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.salesReturn) {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#e11d48', '#fb7185', '#a855f7'],
        });

        toast(`Return ${data.salesReturn.returnNo} processed! Items restocked.`, 'success');
        setProcessedReturn(data.salesReturn);
        setIsReturnReceiptOpen(true);
        if (onReturnProcessed) onReturnProcessed();
      } else {
        setErrorMsg(data.error || 'Failed to process return');
      }
    } catch (err) {
      setErrorMsg('Network error processing return');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
        <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-600 to-pink-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base font-display">
                  Sales Return & Refund Register
                </h3>
                <p className="text-xs text-stone-500">
                  Lookup original bill, select returned units, restock inventory, and issue refund voucher
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-5">
            {/* Step 1: Receipt Number Search Bar */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Step 1: Enter or Scan Original Receipt #
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Receipt className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={receiptQuery}
                    onChange={(e) => setReceiptQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLookupReceipt(receiptQuery)}
                    placeholder={`e.g. ${settings.invoicePrefix || 'TGH-'}20260819-0001`}
                    className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-stone-200 text-xs font-mono font-bold focus:border-rose-500 focus:outline-hidden"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleLookupReceipt(receiptQuery)}
                  disabled={isLoadingSale}
                  className="px-4 py-2.5 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                >
                  {isLoadingSale ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>Lookup Bill</span>
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Step 2: Loaded Sale Info Card */}
            {saleData && (
              <div className="space-y-4">
                {/* Original Bill Metadata Summary */}
                <div className="p-4 rounded-2xl bg-stone-900 text-white flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Receipt Number</span>
                    <span className="font-mono font-bold text-sm text-pink-300">{saleData.receiptNo}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Customer</span>
                    <span className="font-semibold">{saleData.customerName || 'Walk-in Customer'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Sale Date</span>
                    <span className="font-mono text-stone-300">{formatDate(saleData.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Original Total</span>
                    <span className="font-mono font-bold text-emerald-400">{formatMoney(saleData.totalAmount)}</span>
                  </div>
                </div>

                {/* Step 3: Items Return Selector Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                      Step 2: Select Items & Quantities to Return
                    </label>
                    <span className="text-[11px] text-stone-500">
                      Returned units will be automatically restocked into inventory
                    </span>
                  </div>

                  <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-2xs divide-y divide-stone-100">
                    <div className="p-3 bg-stone-50 grid grid-cols-12 gap-2 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      <div className="col-span-5">Product Details</div>
                      <div className="col-span-2 text-center">Purchased / Left</div>
                      <div className="col-span-2 text-center">Return Qty</div>
                      <div className="col-span-3 text-right">Refund Subtotal</div>
                    </div>

                    {returnItems.map((item, idx) => {
                      const isFullyReturned = item.remainingReturnable <= 0;

                      return (
                        <div
                          key={idx}
                          className={`p-3.5 grid grid-cols-12 gap-2 items-center transition-colors ${
                            item.returnQty > 0
                              ? 'bg-rose-50/50'
                              : isFullyReturned
                              ? 'bg-stone-50 opacity-60'
                              : 'hover:bg-stone-50/60'
                          }`}
                        >
                          {/* Product Info */}
                          <div className="col-span-5 min-w-0">
                            <div className="font-bold text-xs text-stone-900 truncate">
                              {item.productName}
                            </div>
                            <div className="text-[10px] text-stone-400 font-mono">
                              SKU: {item.productSku} • {formatMoney(item.unitPrice)} each
                            </div>
                            {item.alreadyReturned > 0 && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                                {item.alreadyReturned} already returned
                              </span>
                            )}
                          </div>

                          {/* Purchased & Remaining returnable */}
                          <div className="col-span-2 text-center text-xs">
                            <span className="font-mono font-bold text-stone-800">{item.originalQty}</span>
                            <span className="text-[10px] text-stone-400 block font-mono">
                              ({item.remainingReturnable} eligible)
                            </span>
                          </div>

                          {/* Return Qty Spinner */}
                          <div className="col-span-2 flex items-center justify-center">
                            {isFullyReturned ? (
                              <span className="text-[10px] text-stone-400 italic">Fully Returned</span>
                            ) : (
                              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemReturnQty(idx, item.returnQty - 1)}
                                  disabled={item.returnQty <= 0}
                                  className="w-5 h-5 rounded-md bg-white hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-stone-700 shadow-2xs"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center font-mono font-bold text-xs">
                                  {item.returnQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemReturnQty(idx, item.returnQty + 1)}
                                  disabled={item.returnQty >= item.remainingReturnable}
                                  className="w-5 h-5 rounded-md bg-white hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-stone-700 shadow-2xs"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Line Refund Total */}
                          <div className="col-span-3 text-right">
                            <div className="font-mono font-bold text-xs text-rose-700">
                              {formatMoney(item.subtotal)}
                            </div>
                            {item.returnQty > 0 && (
                              <select
                                value={item.reason}
                                onChange={(e) => handleUpdateItemReason(idx, e.target.value)}
                                className="mt-1 text-[10px] p-1 rounded-md border border-stone-200 bg-white text-stone-600 focus:outline-hidden max-w-[140px]"
                              >
                                {RETURN_REASONS.map((r) => (
                                  <option key={r} value={r}>
                                    {r}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 4: Refund Options & Summary */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Step 3: Refund Method & Return Notes
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Cash */}
                    <button
                      type="button"
                      onClick={() => setRefundMethod('CASH')}
                      className={`p-3 rounded-xl border flex items-center gap-2 text-left transition-all ${
                        refundMethod === 'CASH'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div className="font-bold text-xs">Cash Refund</div>
                        <div className="text-[10px] text-stone-400">Drawer payout</div>
                      </div>
                    </button>

                    {/* Card */}
                    <button
                      type="button"
                      onClick={() => setRefundMethod('CARD')}
                      className={`p-3 rounded-xl border flex items-center gap-2 text-left transition-all ${
                        refundMethod === 'CARD'
                          ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-bold text-xs">Card Refund</div>
                        <div className="text-[10px] text-stone-400">Card reversal</div>
                      </div>
                    </button>

                    {/* Store Credit Note */}
                    <button
                      type="button"
                      onClick={() => setRefundMethod('CREDIT_NOTE')}
                      className={`p-3 rounded-xl border flex items-center gap-2 text-left transition-all ${
                        refundMethod === 'CREDIT_NOTE'
                          ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-xs'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <FileText className="w-4 h-4 text-purple-600" />
                      <div>
                        <div className="font-bold text-xs">Store Credit Note</div>
                        <div className="text-[10px] text-stone-400">Issue store voucher</div>
                      </div>
                    </button>
                  </div>

                  {/* General Notes */}
                  <div className="pt-2">
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional return notes or reason details..."
                      className="w-full px-3.5 py-2 bg-white rounded-xl border border-stone-200 text-xs focus:border-rose-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Final Calculation Banner */}
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-rose-900 block">
                      Total Units to Restock: {totalReturnQty} item(s)
                    </span>
                    <span className="text-[11px] text-rose-600">
                      Refund Method: {refundMethod}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">
                      Total Refund Amount
                    </span>
                    <span className="text-2xl font-black font-display text-rose-900 font-mono">
                      {formatMoney(totalRefundAmount)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 font-semibold text-xs transition-colors font-display"
            >
              Cancel
            </button>

            {saleData && (
              <button
                type="button"
                onClick={handleProcessReturn}
                disabled={isProcessing || totalReturnQty <= 0}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-600/25 transition-all font-display"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Refund...</span>
                  </>
                ) : (
                  <>
                    <span>Process Return & Restock</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Return Printable Voucher Modal */}
      <ReturnReceiptModal
        isOpen={isReturnReceiptOpen}
        salesReturn={processedReturn}
        onClose={() => {
          setIsReturnReceiptOpen(false);
          onClose();
        }}
      />
    </>
  );
}
