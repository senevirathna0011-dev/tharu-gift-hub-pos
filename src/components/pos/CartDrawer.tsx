'use client';

import React from 'react';
import { CartItem, DiscountType, Customer } from '@/lib/types';
import { useSettings } from '@/context/SettingsContext';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Percent, 
  User, 
  UserPlus, 
  ArrowRight,
  Sparkles,
  Award,
  FileText,
  X
} from 'lucide-react';

interface CartDrawerProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  selectedCustomer: Customer | null;
  customerName: string;
  onOpenCustomerSelect: () => void;
  onClearCustomer: () => void;
  discountType: DiscountType;
  discountValue: number;
  onApplyDiscount: (type: DiscountType, value: number) => void;
  taxRate: number;
  onToggleTax: () => void;
  onProceedToPayment: () => void;
  onGenerateQuotation: () => void;
}

export default function CartDrawer({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  selectedCustomer,
  customerName,
  onOpenCustomerSelect,
  onClearCustomer,
  discountType,
  discountValue,
  onApplyDiscount,
  taxRate,
  onToggleTax,
  onProceedToPayment,
  onGenerateQuotation,
}: CartDrawerProps) {
  const { formatMoney, settings } = useSettings();

  // Financial computations
  const subtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);

  let discountAmount = 0;
  if (discountType === 'PERCENTAGE' && discountValue > 0) {
    discountAmount = +(subtotal * (discountValue / 100)).toFixed(2);
  } else if (discountType === 'FIXED' && discountValue > 0) {
    discountAmount = Math.min(subtotal, discountValue);
  }

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const taxAmount = +(discountedSubtotal * taxRate).toFixed(2);
  const totalAmount = +(discountedSubtotal + taxAmount).toFixed(2);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm">
            {totalItemsCount}
          </div>
          <div>
            <h2 className="font-bold text-stone-900 text-sm font-display">Current Sale</h2>
            <p className="text-[11px] text-stone-500">Order register</p>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-xs text-stone-500 hover:text-rose-600 flex items-center gap-1 font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Customer Bar: Selectable or Quick-add */}
      <div className="px-4 py-2 bg-stone-50 border-b border-stone-200 flex items-center justify-between gap-2 text-xs">
        {selectedCustomer ? (
          <div className="flex items-center justify-between w-full bg-white p-2 rounded-xl border border-rose-200 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center shrink-0">
                {selectedCustomer.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-stone-900 truncate leading-tight flex items-center gap-1">
                  <span>{selectedCustomer.name}</span>
                  {selectedCustomer.loyaltyPoints > 0 && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-mono font-bold flex items-center gap-0.5">
                      <Award className="w-2.5 h-2.5" />
                      {selectedCustomer.loyaltyPoints}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-stone-500 font-mono truncate">
                  {selectedCustomer.phone}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onOpenCustomerSelect}
                className="text-[10px] text-rose-600 hover:underline font-semibold px-1"
              >
                Change
              </button>
              <button
                type="button"
                onClick={onClearCustomer}
                className="p-1 text-stone-400 hover:text-rose-600 rounded-md hover:bg-stone-100 transition-colors"
                title="Remove customer (revert to Walk-in)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenCustomerSelect}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-white hover:bg-rose-50/50 border border-stone-200 hover:border-rose-200 transition-all text-left group"
          >
            <div className="flex items-center gap-2 text-stone-600 group-hover:text-stone-900">
              <User className="w-4 h-4 text-stone-400 group-hover:text-rose-600" />
              <span className="font-medium text-xs">
                {customerName ? customerName : 'Walk-in Customer (Tap to select / add)'}
              </span>
            </div>
            <span className="text-[11px] text-rose-600 font-bold flex items-center gap-0.5 font-display">
              <Plus className="w-3 h-3" />
              <span>Customer</span>
            </span>
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
            <div className="w-14 h-14 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-center mb-3">
              <ShoppingBag className="w-7 h-7 text-stone-300" />
            </div>
            <p className="font-semibold text-stone-700 text-sm font-display">Cart is empty</p>
            <p className="text-xs text-stone-400 mt-1 max-w-[200px]">
              Scan barcodes or tap products from the catalog to build an order.
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center gap-3 p-2.5 rounded-xl border border-stone-200/80 hover:border-rose-200 bg-white transition-all"
            >
              {/* Image / Thumbnail */}
              <div className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden shrink-0 flex items-center justify-center">
                {(item.product.image || item.product.imageUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={(item.product.image || item.product.imageUrl)!}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Sparkles className="w-5 h-5 text-pink-300" />
                )}
              </div>

              {/* Title & Unit Price */}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-stone-900 truncate">
                  {item.product.name}
                </h4>
                <div className="text-[11px] text-stone-500 font-mono">
                  {formatMoney(item.product.sellingPrice)} each
                </div>
              </div>

              {/* Quantity Modifiers */}
              <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-lg">
                <button
                  onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                  className="w-5 h-5 rounded bg-white text-stone-700 hover:bg-stone-200 flex items-center justify-center transition-colors shadow-2xs text-xs font-bold"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-xs font-bold font-mono">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                  disabled={item.quantity >= item.product.stockQuantity}
                  className="w-5 h-5 rounded bg-white text-stone-700 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-2xs text-xs font-bold"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Item Total */}
              <div className="text-right min-w-[60px]">
                <div className="text-xs font-bold text-stone-900 font-display">
                  {formatMoney(item.product.sellingPrice * item.quantity)}
                </div>
                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="text-[10px] text-stone-400 hover:text-rose-600 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Checkout / Quotation Footer */}
      {cart.length > 0 && (
        <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-3">
          {/* Quick Discounts & Tax Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-600 font-medium flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-pink-500" />
                Discount:
              </span>
              <div className="flex items-center gap-1">
                {[
                  { label: 'None', type: 'NONE' as DiscountType, val: 0 },
                  { label: '5%', type: 'PERCENTAGE' as DiscountType, val: 5 },
                  { label: '10%', type: 'PERCENTAGE' as DiscountType, val: 10 },
                  { label: '15%', type: 'PERCENTAGE' as DiscountType, val: 15 },
                ].map((d) => (
                  <button
                    key={d.label}
                    onClick={() => onApplyDiscount(d.type, d.val)}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border transition-all ${
                      discountType === d.type && (d.val === 0 || discountValue === d.val)
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Tax Toggle */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200/60">
              <span className="text-stone-700 font-semibold flex items-center gap-1.5">
                <span>Apply Tax ({(settings.taxRate * 100).toFixed(0)}%):</span>
              </span>
              <button
                type="button"
                onClick={onToggleTax}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-hidden ${
                  taxRate > 0 ? 'bg-rose-600' : 'bg-stone-300'
                }`}
                title={taxRate > 0 ? 'Tax is ON (Click to disable)' : 'Tax is OFF (Click to apply store tax)'}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    taxRate > 0 ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Subtotal, Discounts, Total */}
          <div className="pt-2 border-t border-stone-200 space-y-1 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono font-medium">{formatMoney(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>Discount:</span>
                <span className="font-mono">-{formatMoney(discountAmount)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between">
                <span>Estimated Tax:</span>
                <span className="font-mono font-medium">{formatMoney(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-stone-900 pt-1 border-t border-stone-200">
              <span className="font-display">Total Amount:</span>
              <span className="font-display text-rose-600 text-lg">
                {formatMoney(totalAmount)}
              </span>
            </div>
          </div>

          {/* Action Buttons: Quotation & Checkout */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onGenerateQuotation}
              className="py-3 px-3 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 active:scale-[0.99] text-stone-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs font-display"
              title="Convert cart items into a formal A4 quotation"
            >
              <FileText className="w-4 h-4 text-stone-500" />
              <span>Quotation</span>
            </button>

            <button
              type="button"
              onClick={onProceedToPayment}
              className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30 transition-all font-display"
            >
              <span>Pay Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
