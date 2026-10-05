'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sale } from '@/lib/types';
import ThermalReceipt from './ThermalReceipt';
import { useSettings } from '@/context/SettingsContext';
import { generateInvoicePDF } from '@/lib/pdfInvoice';
import { 
  generateWhatsAppInvoiceText, 
  getWhatsAppShareUrl, 
  cleanPhoneNumberForWhatsApp 
} from '@/lib/whatsapp';
import { 
  Printer, 
  CheckCircle2, 
  X, 
  PlusCircle, 
  Share2, 
  Download, 
  MessageSquare, 
  Phone, 
  Copy, 
  Check, 
  ExternalLink,
  Sparkles,
  FileDown
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface ReceiptModalProps {
  isOpen: boolean;
  sale: Sale | null;
  onClose: () => void;
  onNewSale?: () => void;
}

export default function ReceiptModal({
  isOpen,
  sale,
  onClose,
  onNewSale,
}: ReceiptModalProps) {
  const { settings, formatMoney } = useSettings();
  const { toast } = useToast();

  const [customPhone, setCustomPhone] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  useEffect(() => {
    if (sale) {
      setCustomPhone(sale.customerPhone || sale.customer?.phone || '');
    }
  }, [sale]);

  const handlePrint = useCallback(() => {
    // Ensure DOM is painted and fonts are loaded before triggering print dialog
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
      }, 50);
    });
  }, []);

  const handleShareWhatsApp = useCallback(() => {
    if (!sale) return;
    const phoneToUse = customPhone.trim() || sale.customerPhone || sale.customer?.phone || '';
    const invoiceText = generateWhatsAppInvoiceText(sale, settings);
    const url = getWhatsAppShareUrl(phoneToUse, invoiceText);

    // Open WhatsApp in new tab / window
    window.open(url, '_blank', 'noopener,noreferrer');
    toast('Opening WhatsApp with itemized invoice...', 'info');
  }, [sale, customPhone, settings, toast]);

  const handleCopyWhatsAppText = useCallback(() => {
    if (!sale) return;
    const invoiceText = generateWhatsAppInvoiceText(sale, settings);
    navigator.clipboard.writeText(invoiceText);
    setCopied(true);
    toast('Invoice text copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  }, [sale, settings, toast]);

  const handleDownloadPDF = useCallback(async () => {
    if (!sale) return;
    try {
      setIsDownloadingPdf(true);
      generateInvoicePDF(sale, settings);
      toast('PDF Invoice generated and downloaded!', 'success');
    } catch (err: any) {
      console.error('PDF generation error:', err);
      toast('Failed to generate PDF invoice', 'error');
    } finally {
      setIsDownloadingPdf(false);
    }
  }, [sale, settings, toast]);

  if (!isOpen || !sale) return null;

  const effectivePhone = customPhone.trim() || sale.customerPhone || sale.customer?.phone || '';

  return (
    <div className="print-receipt-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="print-receipt-modal-card relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-stone-50 border-b border-stone-200">
          <div className="flex items-center gap-2.5 text-emerald-600">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-stone-900 text-base font-display">
                  Sale Completed Successfully!
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Paid
                </span>
              </div>
              <p className="text-xs text-stone-500 font-mono">
                Receipt #{sale.receiptNo} &bull; Total: <strong className="text-stone-800">{formatMoney(sale.totalAmount)}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split into Action Control Center & Receipt Preview */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-stone-200">
          {/* Action Control Panel (Left Column on md+) */}
          <div className="no-print md:col-span-6 p-5 sm:p-6 flex flex-col justify-between space-y-5 bg-white">
            {/* Quick Share via WhatsApp Section */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs font-display">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <span>WhatsApp Invoice</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  Instant
                </span>
              </div>

              {/* Customer Phone Input Field */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-700 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <span>Customer Phone / WhatsApp Number:</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="e.g. 0771234567 or +94771234567"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-emerald-300 text-xs font-mono font-medium text-stone-900 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20 shadow-2xs"
                  />
                  {customPhone && (
                    <button
                      type="button"
                      onClick={() => setCustomPhone('')}
                      className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* WhatsApp Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all font-display"
                  title="Open WhatsApp chat with pre-filled itemized invoice"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share via WhatsApp</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </button>

                <button
                  type="button"
                  onClick={handleCopyWhatsAppText}
                  className="px-2.5 py-2.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1"
                  title="Copy formatted invoice text to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[11px] font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-stone-500" />
                      <span className="text-[11px]">Copy Text</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Document & Print Actions */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                Invoice & Receipt Options:
              </span>

              {/* Print Bill Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-rose-600/25 transition-all font-display"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div>Print Thermal Bill</div>
                    <div className="text-[10px] font-normal text-rose-100">
                      Standard 3-Inch (80mm) Roll
                    </div>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-lg bg-white/20 font-mono">
                  80mm
                </span>
              </button>

              {/* Download PDF Invoice Button */}
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isDownloadingPdf}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-stone-300 bg-white hover:bg-stone-50 active:scale-[0.99] text-stone-800 font-bold text-xs shadow-2xs transition-all font-display"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <FileDown className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div>Download PDF Invoice</div>
                    <div className="text-[10px] font-normal text-stone-500">
                      Official A4 Brand Document
                    </div>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-lg bg-stone-100 text-stone-600 font-mono">
                  PDF
                </span>
              </button>
            </div>

            {/* Customer & Order Summary Badge */}
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 text-xs space-y-1">
              <div className="flex justify-between text-stone-600">
                <span>Customer:</span>
                <span className="font-bold text-stone-800">
                  {sale.customerName || 'Walk-in Customer'}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Customer Phone:</span>
                <span className="font-mono font-medium text-stone-800">
                  {effectivePhone || 'None'}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Payment Method:</span>
                <span className="font-semibold text-stone-800">{sale.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Amount Tendered:</span>
                <span className="font-mono font-medium">{formatMoney(sale.amountPaid)}</span>
              </div>
              {sale.changeDue > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-stone-200">
                  <span>Change Given:</span>
                  <span className="font-mono">{formatMoney(sale.changeDue)}</span>
                </div>
              )}
            </div>

            {/* New Sale Button */}
            {onNewSale && (
              <button
                type="button"
                onClick={onNewSale}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-rose-300 hover:border-rose-400 bg-rose-50/50 hover:bg-rose-50 text-rose-700 font-bold text-xs transition-all font-display"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Ready for Next Customer (New Sale)</span>
              </button>
            )}
          </div>

          {/* Receipt Preview Area (Right Column on md+) */}
          <div className="receipt-print-wrapper md:col-span-6 p-4 sm:p-6 overflow-y-auto flex justify-center bg-stone-100/80 max-h-[70vh]">
            <ThermalReceipt sale={sale} />
          </div>
        </div>

        {/* Modal Bottom Bar for Small Devices */}
        <div className="no-print md:hidden p-3 bg-white border-t border-stone-200 flex items-center justify-between gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs font-display"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Bill</span>
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs font-display"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
          {onNewSale && (
            <button
              onClick={onNewSale}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs font-display"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
