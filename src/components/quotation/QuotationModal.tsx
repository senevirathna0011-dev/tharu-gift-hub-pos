'use client';

import React, { useCallback } from 'react';
import { Quotation } from '@/lib/types';
import { formatDate, formatCurrency, formatItemNameWithWarranty } from '@/lib/formatters';
import { generateWhatsAppQuotationText, getWhatsAppShareUrl } from '@/lib/whatsapp';
import { useSettings } from '@/context/SettingsContext';
import { 
  X, 
  Printer, 
  FileText, 
  Gift, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Clock, 
  ShieldAlert,
  Download,
  Share2
} from 'lucide-react';

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation | null;
}

export default function QuotationModal({
  isOpen,
  onClose,
  quotation,
}: QuotationModalProps) {
  const { settings, formatMoney } = useSettings();

  const handlePrint = useCallback(() => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
      }, 50);
    });
  }, []);

  const handleShareWhatsApp = useCallback(() => {
    if (!quotation) return;
    const phone = quotation.customerPhone || quotation.customer?.phone || '';
    const text = generateWhatsAppQuotationText(quotation, settings);
    const url = getWhatsAppShareUrl(phone, text);
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [quotation, settings]);

  if (!isOpen || !quotation) return null;

  const storeName = settings.shopName || 'Tharu Gift Hub';
  const storeTagline = settings.shopTagline || 'Curated Gifts, Keepsakes & Heartfelt Moments';
  const storeAddress = settings.address || '452 Velvet Lane, West District';
  const storePhone = settings.phone || '+1 (555) 839-4438';
  const storeEmail = settings.email || 'orders@blissandbloomgifts.com';
  const currency = settings.currencySymbol || '$';

  return (
    <div className="quotation-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="quotation-modal-card relative w-full max-w-3xl bg-stone-50 rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Action Header */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-white border-b border-stone-200">
          <div className="flex items-center gap-2 text-rose-600">
            <FileText className="w-5 h-5" />
            <div>
              <h3 className="font-bold text-stone-900 text-base font-display">
                Proforma Invoice / Quotation
              </h3>
              <p className="text-[11px] text-stone-500 font-mono">
                Standard A4 Document Preview
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all font-display cursor-pointer"
              title="Share quotation estimate via WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span>Share via WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-rose-600/25 transition-all font-display"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* A4 Document Preview Container */}
        <div className="quotation-print-wrapper p-6 sm:p-8 overflow-y-auto flex-1 flex justify-center bg-stone-100/80">
          <div
            id="quotation-a4-printable"
            className="quotation-a4-page w-full max-w-[210mm] bg-white text-stone-900 shadow-xl border border-stone-300 p-8 sm:p-10 rounded-2xl space-y-6 box-border font-sans"
          >
            {/* Header: Shop branding & Document Title */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-6 border-b border-stone-200 pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-stone-900 font-display tracking-tight">
                      {storeName}
                    </h1>
                    <p className="text-xs text-stone-500 italic">{storeTagline}</p>
                  </div>
                </div>
                <div className="text-xs text-stone-600 pt-2 space-y-0.5 font-medium">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>{storeAddress}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>Tel: {storePhone}</span>
                  </div>
                  {storeEmail && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-stone-400" />
                      <span>{storeEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quotation Meta Badge */}
              <div className="sm:text-right bg-stone-50 p-4 rounded-2xl border border-stone-200/80 min-w-[200px] space-y-1.5">
                <div className="text-xs font-bold text-rose-600 uppercase tracking-wider font-display">
                  PROFORMA INVOICE
                </div>
                <div className="text-base font-black font-mono text-stone-900">
                  {quotation.quotationNo}
                </div>
                <div className="text-xs text-stone-600 space-y-0.5 pt-1">
                  <div className="flex justify-between sm:justify-end gap-3">
                    <span className="text-stone-400">Date Issued:</span>
                    <span className="font-semibold">{formatDate(quotation.createdAt)}</span>
                  </div>
                  <div className="flex justify-between sm:justify-end gap-3 text-rose-700 font-semibold">
                    <span>Valid Until:</span>
                    <span>{formatDate(quotation.validUntil)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To Customer Section */}
            <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/70">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                BILL TO / CLIENT DETAILS:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">
                    {quotation.customerName || 'Valued Customer'}
                  </h4>
                  {quotation.customerPhone && (
                    <div className="text-stone-600 font-mono mt-0.5">
                      Phone: {quotation.customerPhone}
                    </div>
                  )}
                </div>
                <div>
                  {quotation.customerEmail && (
                    <div className="text-stone-600">
                      Email: {quotation.customerEmail}
                    </div>
                  )}
                  {quotation.customerAddress && (
                    <div className="text-stone-600">
                      Address: {quotation.customerAddress}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-stone-300 bg-stone-100 text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    <th className="py-3 px-3 w-12 text-center">#</th>
                    <th className="py-3 px-3">Item Description</th>
                    <th className="py-3 px-3 font-mono">SKU</th>
                    <th className="py-3 px-3 text-center w-16">Qty</th>
                    <th className="py-3 px-3 text-right w-28">Unit Price</th>
                    <th className="py-3 px-3 text-right w-28">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {quotation.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-stone-50/50">
                      <td className="py-3 px-3 text-center text-stone-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 font-bold text-stone-900">
                        {formatItemNameWithWarranty(item.productName, item.warranty)}
                      </td>
                      <td className="py-3 px-3 font-mono text-stone-500 text-[11px]">
                        {item.productSku}
                      </td>
                      <td className="py-3 px-3 text-center font-bold font-mono">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-stone-700">
                        {formatCurrency(item.unitPrice, currency)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-stone-900">
                        {formatCurrency(item.subtotal, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-stone-200 pt-4">
              <div className="text-xs text-stone-600 max-w-sm space-y-1">
                {quotation.notes && (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="font-bold text-stone-800 block mb-0.5">Quotation Notes:</span>
                    <p className="text-[11px] italic">{quotation.notes}</p>
                  </div>
                )}
              </div>

              {/* Totals Breakdown */}
              <div className="w-full sm:w-72 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold">{formatCurrency(quotation.subtotal, currency)}</span>
                </div>

                {quotation.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>Discount:</span>
                    <span className="font-mono">-{formatCurrency(quotation.discountAmount, currency)}</span>
                  </div>
                )}

                {quotation.taxAmount > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Tax ({(quotation.taxRate * 100).toFixed(0)}%):</span>
                    <span className="font-mono">{formatCurrency(quotation.taxAmount, currency)}</span>
                  </div>
                )}

                <div className="border-t-2 border-stone-900 pt-2 flex justify-between text-base font-black text-stone-900 font-display">
                  <span>GRAND TOTAL:</span>
                  <span className="text-rose-600 font-mono">{formatCurrency(quotation.totalAmount, currency)}</span>
                </div>
              </div>
            </div>

            {/* MANDATORY TERMS & POLICY FOOTER */}
            <div className="border-t-2 border-dashed border-stone-300 pt-5 space-y-4">
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs space-y-1.5 text-amber-900">
                <div className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Terms & Conditions:</span>
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-950 font-medium">
                  <li>This quotation is valid for 14 days from the date of issue.</li>
                  <li>Prices are subject to change without prior notice.</li>
                  <li>This document is a formal price estimate and does not reserve inventory until payment is confirmed.</li>
                </ul>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-6 text-xs text-center text-stone-500">
                <div className="border-t border-stone-300 pt-2">
                  <span>Authorized Signature & Company Stamp</span>
                </div>
                <div className="border-t border-stone-300 pt-2">
                  <span>Customer Acceptance (Signature & Date)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
