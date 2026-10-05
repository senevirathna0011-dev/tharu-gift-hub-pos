'use client';

import React from 'react';
import { Sale } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useSettings } from '@/context/SettingsContext';

interface ThermalReceiptProps {
  sale: Sale;
  cashierNameOverride?: string;
}

export default function ThermalReceipt({
  sale,
  cashierNameOverride,
}: ThermalReceiptProps) {
  const { settings } = useSettings();

  const storeName = settings.shopName || 'Tharu Gift Hub';
  const storeTagline = settings.shopTagline || 'Curated Gifts & Heartfelt Moments';
  const storeAddress = settings.address || '452 Velvet Lane, West District';
  const storePhone = settings.phone || '+1 (555) 839-4438';
  const storeEmail = settings.email || '';
  const storeLogo = settings.shopLogo;
  const showLogo = settings.showLogoOnReceipt !== false && !!storeLogo;
  const headerNote = settings.headerNote;
  const receiptFooter = settings.footerNote || settings.receiptFooter || 'Thank you for shopping with us! Visit again. ✨';
  const receiptNote = settings.receiptNote || 'Items in original condition can be exchanged within 14 days with this receipt.';
  const currency = settings.currencySymbol || '$';

  const cashier = cashierNameOverride || sale.cashierName || 'Cashier';
  const totalItemsCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      id="receipt-print-area"
      className="receipt-thermal-roll bg-white text-black font-mono text-[10.5px] leading-[1.2] p-[1.5mm] mx-auto w-[80mm] max-w-[80mm] shadow-lg border border-stone-300 select-none box-border"
    >
      {/* STORE HEADER */}
      <div className="text-center pb-0.5">
        {/* SHOP LOGO */}
        {showLogo && storeLogo && (
          <div className="flex justify-center mb-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={storeLogo}
              alt={storeName}
              className="max-h-12 max-w-[45mm] object-contain filter grayscale contrast-125"
            />
          </div>
        )}

        <div className="text-[13px] font-extrabold tracking-wider uppercase leading-snug">
          {storeName}
        </div>
        {storeTagline && (
          <div className="text-[8.5px] text-stone-600 italic mt-0.5 leading-tight">
            {storeTagline}
          </div>
        )}
        <div className="text-[9.5px] text-stone-800 mt-0.5">{storeAddress}</div>
        <div className="text-[9.5px] text-stone-800">Tel: {storePhone}</div>
        {storeEmail && <div className="text-[8.5px] text-stone-700">{storeEmail}</div>}
        {headerNote && (
          <div className="text-[9px] font-semibold text-stone-900 mt-1 italic">
            {headerNote}
          </div>
        )}
      </div>

      {/* DASHED DIVIDER */}
      <div className="thermal-divider my-1 text-center text-stone-600 text-[9px] tracking-tighter select-none">
        ------------------------------------------
      </div>

      {/* RECEIPT METADATA */}
      <div className="text-[9.5px] space-y-0.5 pb-0.5">
        <div className="flex justify-between items-center">
          <span className="font-bold">RECEIPT #:</span>
          <span className="font-extrabold font-mono">{sale.receiptNo}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Date/Time:</span>
          <span>{formatDate(sale.createdAt)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Customer:</span>
          <span className="font-medium truncate max-w-[140px] text-right">
            {sale.customerName || 'Walk-in Customer'}
          </span>
        </div>
        {(sale.customerPhone || sale.customer?.phone) && (
          <div className="flex justify-between items-center">
            <span>Customer Tel:</span>
            <span className="font-mono font-medium text-right">
              {sale.customerPhone || sale.customer?.phone}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span>Cashier:</span>
          <span className="font-semibold">{cashier}</span>
        </div>
      </div>

      {/* DASHED DIVIDER */}
      <div className="thermal-divider my-1 text-center text-stone-600 text-[9px] tracking-tighter select-none">
        ------------------------------------------
      </div>

      {/* ITEMS TABLE HEADER */}
      <div className="flex justify-between font-bold text-[9.5px] pb-0.5 border-b border-dashed border-black">
        <span className="w-[45%] text-left">ITEM</span>
        <span className="w-[15%] text-center">QTY</span>
        <span className="w-[20%] text-right">PRICE</span>
        <span className="w-[20%] text-right">TOTAL</span>
      </div>

      {/* ITEMS LIST */}
      <div className="py-0.5 space-y-1">
        {sale.items.map((item, index) => (
          <div key={item.id || index} className="text-[9.5px] leading-tight">
            <div className="font-bold text-black break-words">{item.productName}</div>
            <div className="flex justify-between items-center text-stone-800 text-[9px]">
              <span className="w-[45%] text-stone-600 font-sans text-[8px] truncate">
                {item.productSku}
              </span>
              <span className="w-[15%] text-center font-semibold">{item.quantity}x</span>
              <span className="w-[20%] text-right font-mono">{formatCurrency(item.unitPrice, currency)}</span>
              <span className="w-[20%] text-right font-bold font-mono">{formatCurrency(item.subtotal, currency)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* DASHED DIVIDER */}
      <div className="thermal-divider my-1 text-center text-stone-600 text-[9px] tracking-tighter select-none">
        ------------------------------------------
      </div>

      {/* FINANCIAL TOTALS */}
      <div className="text-[9.5px] space-y-0.5">
        <div className="flex justify-between">
          <span>Item Count:</span>
          <span className="font-bold">{totalItemsCount} units</span>
        </div>
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span className="font-mono">{formatCurrency(sale.subtotal, currency)}</span>
        </div>

        {sale.discountAmount > 0 && (
          <div className="flex justify-between text-stone-900 font-semibold">
            <span>
              Discount{' '}
              {sale.discountType === 'PERCENTAGE' ? `(${sale.discountValue}%)` : '(Fixed)'}:
            </span>
            <span className="font-mono">-{formatCurrency(sale.discountAmount, currency)}</span>
          </div>
        )}

        {sale.taxAmount > 0 && (
          <div className="flex justify-between">
            <span>Tax ({(sale.taxRate * 100).toFixed(0)}%):</span>
            <span className="font-mono">{formatCurrency(sale.taxAmount, currency)}</span>
          </div>
        )}

        {/* GRAND TOTAL */}
        <div className="border-t-2 border-b-2 border-black py-1 my-1">
          <div className="flex justify-between items-center text-[12px] font-black">
            <span>GRAND TOTAL:</span>
            <span className="font-mono">{formatCurrency(sale.totalAmount, currency)}</span>
          </div>
        </div>

        {/* PAYMENT DETAILS */}
        <div className="flex justify-between pt-0.5">
          <span>Payment:</span>
          <span className="font-bold">{sale.paymentMethod}</span>
        </div>
        <div className="flex justify-between">
          <span>Paid:</span>
          <span className="font-mono">{formatCurrency(sale.amountPaid, currency)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Change:</span>
          <span className="font-mono">{formatCurrency(sale.changeDue, currency)}</span>
        </div>
      </div>

      {/* ORDER NOTES */}
      {sale.notes && (
        <div className="mt-1 p-1 bg-stone-100 border border-dashed border-stone-300 rounded text-[8.5px] text-stone-800 italic break-words">
          Note: {sale.notes}
        </div>
      )}

      {/* DASHED DIVIDER */}
      <div className="thermal-divider my-1 text-center text-stone-600 text-[9px] tracking-tighter select-none">
        ------------------------------------------
      </div>

      {/* THERMAL BARCODE SIMULATION */}
      <div className="text-center my-1 select-none">
        <div className="tracking-[2.5px] font-mono text-[13px] font-black scale-y-110 select-none leading-none">
          ||| | |||| || ||||| | |||| || |||
        </div>
        <div className="text-[8.5px] tracking-wider text-stone-700 mt-0.5 font-mono">{sale.receiptNo}</div>
      </div>

      {/* STORE FOOTER & POLICY */}
      <div className="text-center text-[8.5px] space-y-0.5 pt-0.5 text-stone-800 leading-tight">
        <p className="font-bold">{receiptFooter}</p>
        {receiptNote && (
          <p className="text-[7.5px] text-stone-600 leading-tight">{receiptNote}</p>
        )}
      </div>
    </div>
  );
}
