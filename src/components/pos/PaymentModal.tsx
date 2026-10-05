'use client';

import React, { useState, useEffect } from 'react';
import { PaymentMethod } from '@/lib/types';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { 
  Banknote, 
  CreditCard, 
  Smartphone, 
  Check, 
  Printer, 
  X, 
  AlertCircle, 
  Loader2, 
  Receipt,
  User,
  Phone,
  MessageSquare
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  customerName?: string;
  initialCustomerPhone?: string;
  onCompleteSale: (
    paymentMethod: PaymentMethod,
    amountPaid: number,
    notes?: string,
    customerPhone?: string
  ) => Promise<void>;
  isProcessing: boolean;
}

export default function PaymentModal({
  isOpen,
  onClose,
  totalAmount,
  customerName = 'Walk-in Customer',
  initialCustomerPhone = '',
  onCompleteSale,
  isProcessing,
}: PaymentModalProps) {
  const { formatMoney, settings } = useSettings();
  const { currentUser } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const currency = settings.currencySymbol || '$';

  useEffect(() => {
    if (isOpen) {
      // Default cash input to exact amount
      setAmountPaidInput(totalAmount.toFixed(2));
      setPaymentMethod('CASH');
      setCustomerPhone(initialCustomerPhone || '');
      setNotes('');
    }
  }, [isOpen, totalAmount, initialCustomerPhone]);

  if (!isOpen) return null;

  const tendered = parseFloat(amountPaidInput) || 0;
  const changeDue = paymentMethod === 'CASH' ? Math.max(0, +(tendered - totalAmount).toFixed(2)) : 0;
  const isCashInsufficient = paymentMethod === 'CASH' && tendered < totalAmount - 0.001;

  // Preset cash increments based on currency
  const isLkrOrRs = ['LKR', 'Rs.', '₹', 'Rs'].some((s) => currency.includes(s));
  const baseIncrements = isLkrOrRs ? [100, 500, 1000, 5000] : [10, 20, 50, 100];

  const cashPresets = [
    { label: 'Exact', value: totalAmount },
    ...baseIncrements.map((v) => ({ label: `${currency}${v}`, value: v })),
    { label: `+${currency}${isLkrOrRs ? '500' : '5'}`, value: totalAmount + (isLkrOrRs ? 500 : 5) },
    { label: `+${currency}${isLkrOrRs ? '1000' : '10'}`, value: totalAmount + (isLkrOrRs ? 1000 : 10) },
  ].filter((p) => p.value >= totalAmount || p.label.startsWith('+'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCashInsufficient) return;
    const finalAmount = paymentMethod === 'CASH' ? tendered : totalAmount;
    await onCompleteSale(paymentMethod, finalAmount, notes, customerPhone.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center shadow-xs">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base font-display">
                Checkout & Payment
              </h3>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span>Customer: <strong className="text-stone-800">{customerName}</strong></span>
                <span>&bull;</span>
                <span>Cashier: <strong className="text-stone-800">{currentUser?.name || 'Cashier'}</strong></span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Total Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white flex items-center justify-between shadow-md shadow-pink-500/20">
            <div>
              <span className="text-xs text-pink-100 font-medium uppercase tracking-wider">
                Total Payable Amount
              </span>
              <div className="text-2xl sm:text-3xl font-black font-display tracking-tight mt-0.5">
                {formatMoney(totalAmount)}
              </div>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs">
                {paymentMethod}
              </span>
            </div>
          </div>

          {/* Optional Customer Phone Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-rose-500" />
                <span>Customer Phone Number (Optional)</span>
              </label>
              <span className="text-[11px] text-stone-400 flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-emerald-500" />
                WhatsApp Invoice
              </span>
            </div>
            <div className="relative">
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 0771234567 (Works for walk-in/guest customers)"
                className="w-full px-3.5 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-mono text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:border-rose-500 focus:bg-white transition-colors"
              />
              {customerPhone && (
                <button
                  type="button"
                  onClick={() => setCustomerPhone('')}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'CASH' as PaymentMethod, label: 'Cash', icon: Banknote },
                { id: 'CARD' as PaymentMethod, label: 'Card / POS', icon: CreditCard },
                { id: 'DIGITAL' as PaymentMethod, label: 'Digital / QR', icon: Smartphone },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => {
                      setPaymentMethod(m.id);
                      if (m.id !== 'CASH') setAmountPaidInput(totalAmount.toFixed(2));
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? 'border-rose-600 bg-rose-50/50 text-rose-700 shadow-xs'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-0.5" />
                    <span className="text-xs font-bold">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Calculator (if CASH selected) */}
          {paymentMethod === 'CASH' && (
            <div className="space-y-2.5 p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700">Cash Received ({currency}):</label>
                <div className="relative w-40">
                  <span className="absolute left-3 top-2 text-stone-400 font-mono text-xs">{currency}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amountPaidInput}
                    onChange={(e) => setAmountPaidInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white rounded-xl border border-stone-300 font-mono font-bold text-base text-stone-900 focus:outline-hidden focus:border-rose-500 text-right"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick Cash Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-stone-500 font-medium mr-1">Quick:</span>
                {cashPresets.map((p, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setAmountPaidInput(p.value.toFixed(2))}
                    className="px-2.5 py-1 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-stone-700 border border-stone-200 rounded-lg text-xs font-semibold font-mono transition-colors shadow-2xs"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Change Due Box */}
              <div
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                  isCashInsufficient
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {isCashInsufficient ? (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  ) : (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span className="text-xs font-bold">
                    {isCashInsufficient ? 'Amount is Insufficient' : 'Change Due:'}
                  </span>
                </div>
                <div className="font-mono text-sm sm:text-base font-extrabold font-display">
                  {isCashInsufficient
                    ? `Missing ${formatMoney(totalAmount - tendered)}`
                    : formatMoney(changeDue)}
                </div>
              </div>
            </div>
          )}

          {/* Optional Order / Gift Note */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Order Note / Gift Tag Message (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Include greeting card & gift wrap"
              className="w-full px-3.5 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:border-rose-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-3 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 font-semibold text-xs transition-colors flex-1"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isProcessing || isCashInsufficient}
              className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm flex-[2] flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all font-display"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Sale...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>Complete & Print Bill</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
