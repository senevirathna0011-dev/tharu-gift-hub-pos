'use client';

import React from 'react';
import { SalesReturn } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useSettings } from '@/context/SettingsContext';

interface ReturnThermalReceiptProps {
  salesReturn: SalesReturn;
  cashierNameOverride?: string;
}

export default function ReturnThermalReceipt({
  salesReturn,
  cashierNameOverride,
}: ReturnThermalReceiptProps) {
  const { settings } = useSettings();

  const storeName = settings.shopName || 'Tharu Gift Hub';
  const storeTagline = settings.shopTagline || 'Curated Gifts & Heartfelt Moments';
  const storeAddress = settings.address || '452 Velvet Lane, West District';
  const storePhone = settings.phone || '+1 (555) 839-4438';
  const currency = settings.currencySymbol || '$';

  const cashier = cashierNameOverride || salesReturn.cashierName || 'Cashier';
  const totalItemsReturned = salesReturn.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      id="receipt-print-area"
      className="receipt-thermal-roll bg-white text-black font-mono text-[10.5px] leading-[1.2] p-[1.5mm] mx-auto w-[80mm] max-w-[80mm] shadow-lg border border-stone-300 select-none box-border"
    >
      {/* STORE HEADER */}
      <div className="text-center pb-0.5">
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
      </div>

      {/* DASHED DIVIDER */}
      <div className="thermal-divider my-1 text-center text-stone-600 text-[9px] tracking-tighter select-none">
        ------------------------------------------
      </div>

      {/* RETURN BANNER */}
      <div className="text-center py-0.5">
        <div className="text-[12px] font-black tracking-widest uppercase border border-black py-0.5 inline-block px-3">
          *** RETURN / REFUND NOTE ***
        </div>
      </div>

      {/* DASHED DIVIDER */}
      <div className="thermal-divider my-1 text-center text-stone-600 text-[9px] tracking-tighter select-none">
        ------------------------------------------
      </div>

      {/* RETURN METADATA */}
      <div className="text-[9.5px] space-y-0.5 pb-0.5">
        <div className="flex justify-between items-center">
          <span className="font-bold">RETURN #:</span>
          <span className="font-extrabold font-mono">{salesReturn.returnNo}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold">ORIGINAL BILL #:</span>
          <span className="font-semibold font-mono">{salesReturn.receiptNo}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Date/Time:</span>
          <span>{formatDate(salesReturn.createdAt)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Customer:</span>
          <span className="font-medium truncate max-w-[140px] text-right">
            {salesReturn.customerName || 'Walk-in Customer'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>Processed By:</span>
          <span className="font-semibold">{cashier}</span>
        </div>
      </div>

      {/* DASHED DIVIDER */}
      <div className="thermal-divider my-1 text-center text-stone-600 text-[9px] tracking-tighter select-none">
        ------------------------------------------
      </div>

      {/* ITEMS TABLE HEADER */}
      <div className="flex justify-between font-bold text-[9.5px] pb-0.5 border-b border-dashed border-black">
        <span className="w-[45%] text-left">RETURNED ITEM</span>
        <span className="w-[15%] text-center">QTY</span>
        <span className="w-[20%] text-right">PRICE</span>
        <span className="w-[20%] text-right">REFUND</span>
      </div>

      {/* RETURNED ITEMS LIST */}
      <div className="py-0.5 space-y-1">
        {salesReturn.items.map((item, index) => (
          <div key={item.id || index} className="text-[9.5px] leading-tight">
            <div className="font-bold text-black break-words">{item.productName}</div>
            <div className="flex justify-between items-center text-stone-800 text-[9px]">
              <span className="w-[45%] text-stone-600 font-sans text-[8px] truncate">
                {item.productSku} {item.reason ? `(${item.reason})` : ''}
              </span>
              <span className="w-[15%] text-center font-semibold text-rose-700">-{item.quantity}x</span>
              <span className="w-[20%] text-right font-mono">{formatCurrency(item.unitPrice, currency)}</span>
              <span className="w-[20%] text-right font-bold font-mono text-rose-700">
                -{formatCurrency(item.subtotal, currency)}
              </span>
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
          <span>Items Returned:</span>
          <span className="font-bold">{totalItemsReturned} units</span>
        </div>
        <div className="flex justify-between">
          <span>Return Reason:</span>
          <span className="font-medium">{salesReturn.reason}</span>
        </div>

        {/* REFUND AMOUNT TOTAL */}
        <div className="border-t-2 border-b-2 border-black py-1 my-1">
          <div className="flex justify-between items-center text-[12px] font-black">
            <span>TOTAL REFUND:</span>
            <span className="font-mono text-rose-700">
              {formatCurrency(salesReturn.refundAmount, currency)}
            </span>
          </div>
        </div>

        {/* REFUND METHOD */}
        <div className="flex justify-between pt-0.5">
          <span>Refund Method:</span>
          <span className="font-bold uppercase">{salesReturn.refundMethod}</span>
        </div>
        <div className="flex justify-between text-emerald-800 font-bold text-[9px]">
          <span>Inventory Status:</span>
          <span>RESTOCKED (+{totalItemsReturned})</span>
        </div>
      </div>

      {/* NOTES */}
      {salesReturn.notes && (
        <div className="mt-1 p-1 bg-stone-100 border border-dashed border-stone-300 rounded text-[8.5px] text-stone-800 italic break-words">
          Note: {salesReturn.notes}
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
        <div className="text-[8.5px] tracking-wider text-stone-700 mt-0.5 font-mono">
          {salesReturn.returnNo}
        </div>
      </div>

      {/* STORE FOOTER */}
      <div className="text-center text-[8.5px] space-y-0.5 pt-0.5 text-stone-800 leading-tight">
        <p className="font-bold">Customer Copy / Credit Voucher</p>
        <p className="text-[7.5px] text-stone-600">Please retain this voucher for your records.</p>
      </div>
    </div>
  );
}
