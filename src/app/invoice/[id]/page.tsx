'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Sale, StoreSettings } from '@/lib/types';
import { formatDate, formatCurrency, formatItemNameWithWarranty } from '@/lib/formatters';
import { generateInvoicePDF, createInvoicePDFBlob } from '@/lib/pdfInvoice';
import { generateWhatsAppInvoiceText, getWhatsAppShareUrl } from '@/lib/whatsapp';
import { 
  CheckCircle2, 
  Printer, 
  FileDown, 
  Share2, 
  Phone, 
  Mail, 
  MapPin, 
  Gift, 
  Receipt, 
  AlertCircle, 
  Loader2, 
  Store,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Banknote,
  Smartphone
} from 'lucide-react';

export default function PublicInvoicePage() {
  const params = useParams();
  const id = params?.id as string;

  const [sale, setSale] = useState<Sale | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoice = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/invoice/${encodeURIComponent(id)}`);
      const data = await res.json();
      if (data.success && data.sale) {
        setSale(data.sale);
        setStoreSettings(data.storeSettings);
      } else {
        setError(data.error || 'Invoice not found');
      }
    } catch (err: any) {
      setError('Unable to load invoice. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!sale) return;
    const settings = storeSettings || {
      shopName: 'Tharu Gift Hub',
      address: '452 Velvet Lane, West District',
      phone: '+1 (555) 839-4438',
      currencySymbol: '$',
      currencyCode: 'USD',
      taxRate: 0.08,
      receiptFooter: 'Thank you for shopping with us!',
    };
    generateInvoicePDF(sale, settings);
  };

  const handleShareWhatsApp = async () => {
    if (!sale) return;
    const settings = storeSettings || {
      shopName: 'Tharu Gift Hub',
      address: '',
      phone: '',
      currencySymbol: '$',
      currencyCode: 'USD',
      taxRate: 0.08,
      receiptFooter: 'Thank you for shopping with us!',
    };

    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const invoiceText = generateWhatsAppInvoiceText(sale, settings, currentUrl);
    const phone = sale.customerPhone || sale.customer?.phone || '';

    // If Web Share API with files is supported on mobile
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        const pdfBlob = createInvoicePDFBlob(sale, settings);
        const pdfFile = new File([pdfBlob], `Invoice-${sale.receiptNo}.pdf`, {
          type: 'application/pdf',
        });

        if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
          await navigator.share({
            title: `Invoice #${sale.receiptNo}`,
            text: invoiceText,
            files: [pdfFile],
          });
          return;
        } else {
          await navigator.share({
            title: `Invoice #${sale.receiptNo}`,
            text: invoiceText,
            url: currentUrl,
          });
          return;
        }
      } catch (err) {
        // Fallback to direct wa.me link
      }
    }

    const waUrl = getWhatsAppShareUrl(phone, invoiceText);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-pink-100 flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 text-pink-600 animate-spin" />
        </div>
        <h2 className="text-lg font-bold text-stone-900 font-display">Loading Verified Invoice...</h2>
        <p className="text-xs text-stone-500 mt-1">Fetching transaction details from store records.</p>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-rose-600" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 font-display">Invoice Not Found</h2>
        <p className="text-xs text-stone-500 mt-1 max-w-sm text-center mb-6">
          {error || 'We could not find an invoice matching this receipt ID. Please contact the store cashier.'}
        </p>
        <a
          href="/"
          className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs font-display transition-colors"
        >
          Return to Home
        </a>
      </div>
    );
  }

  const store = storeSettings || {
    shopName: 'Tharu Gift Hub',
    shopTagline: 'Curated Gifts, Keepsakes & Heartfelt Moments',
    address: '452 Velvet Lane, West District',
    phone: '+1 (555) 839-4438',
    email: 'hello@blissandbloomgifts.com',
    currencySymbol: '$',
    currencyCode: 'USD',
    taxRate: 0.08,
    receiptFooter: 'Thank you for shopping with us! Visit again. ✨',
    receiptNote: 'Items in original condition can be exchanged within 14 days with receipt.',
  };

  const currency = store.currencySymbol || '$';
  const totalItemsCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/40 via-stone-50 to-stone-100 py-8 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Action Toolbar (Hidden during print) */}
        <div className="no-print bg-white/80 backdrop-blur-md rounded-2xl border border-stone-200/80 p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-stone-800 font-display">
              Official Electronic Invoice & Receipt
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleShareWhatsApp}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all font-display"
              title="Share invoice on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all font-display"
              title="Download official PDF invoice"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all font-display"
              title="Print invoice"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Invoice Card */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xl p-6 sm:p-10 space-y-8 print:shadow-none print:border-none print:p-0">
          {/* Header Branding */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 border-b border-stone-200 pb-6">
            <div className="flex items-start gap-4">
              {store.shopLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={store.shopLogo}
                  alt={store.shopName}
                  className="w-16 h-16 rounded-2xl object-contain border border-stone-200 p-1 shrink-0 bg-stone-50"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
                  <Gift className="w-8 h-8" />
                </div>
              )}

              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-black text-stone-900 font-display tracking-tight">
                  {store.shopName}
                </h1>
                {store.shopTagline && (
                  <p className="text-xs text-stone-500 italic">{store.shopTagline}</p>
                )}
                <div className="text-xs text-stone-600 pt-1 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>{store.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{store.phone}</span>
                  </div>
                  {store.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-stone-400" />
                      <span>{store.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice Meta Box */}
            <div className="sm:text-right bg-stone-50 p-4 rounded-2xl border border-stone-200/80 min-w-[220px] space-y-2">
              <div className="flex items-center justify-between sm:justify-end gap-2">
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider font-display">
                  Official Invoice
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>PAID</span>
                </span>
              </div>

              <div className="text-lg font-black font-mono text-stone-900">
                #{sale.receiptNo}
              </div>

              <div className="text-xs text-stone-600 space-y-0.5 pt-1">
                <div className="flex justify-between sm:justify-end gap-3">
                  <span className="text-stone-400">Date:</span>
                  <span className="font-semibold">{formatDate(sale.createdAt)}</span>
                </div>
                <div className="flex justify-between sm:justify-end gap-3">
                  <span className="text-stone-400">Cashier:</span>
                  <span className="font-semibold">{sale.cashierName || 'Cashier'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Billing Box */}
          <div className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                Billed To Customer:
              </span>
              <div className="font-bold text-stone-900 text-sm">
                {sale.customerName || 'Walk-in Customer'}
              </div>
              {(sale.customerPhone || sale.customer?.phone) && (
                <div className="text-stone-600 font-mono mt-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-stone-400" />
                  <span>{sale.customerPhone || sale.customer?.phone}</span>
                </div>
              )}
            </div>

            <div className="sm:text-right">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                Payment Method & Status:
              </span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-stone-200 font-bold text-stone-800">
                {sale.paymentMethod === 'CASH' && <Banknote className="w-3.5 h-3.5 text-emerald-600" />}
                {sale.paymentMethod === 'CARD' && <CreditCard className="w-3.5 h-3.5 text-blue-600" />}
                {sale.paymentMethod === 'DIGITAL' && <Smartphone className="w-3.5 h-3.5 text-purple-600" />}
                <span>{sale.paymentMethod} PAYMENT</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-stone-200 bg-stone-100/70 text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-3">Item Description</th>
                  <th className="py-3 px-3 font-mono">SKU</th>
                  <th className="py-3 px-3 text-center w-16">Qty</th>
                  <th className="py-3 px-3 text-right w-28">Unit Price</th>
                  <th className="py-3 px-3 text-right w-28">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {sale.items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-stone-50/50">
                    <td className="py-3.5 px-3 text-center text-stone-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-stone-900">
                      {formatItemNameWithWarranty(item.productName, item.warranty)}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-stone-500 text-[11px]">
                      {item.productSku}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold font-mono">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-stone-700">
                      {formatCurrency(item.unitPrice, currency)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-stone-900">
                      {formatCurrency(item.subtotal, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-stone-200 pt-6">
            {/* Notes Section */}
            <div className="text-xs text-stone-600 max-w-sm space-y-2">
              {sale.notes && (
                <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-200/60">
                  <span className="font-bold text-rose-800 block mb-0.5">Order Note / Gift Tag:</span>
                  <p className="text-[11px] italic text-rose-950">{sale.notes}</p>
                </div>
              )}

              {store.headerNote && (
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 text-[11px] italic text-stone-600">
                  &ldquo;{store.headerNote}&rdquo;
                </div>
              )}
            </div>

            {/* Totals Summary */}
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Items Count:</span>
                <span className="font-bold text-stone-800">{totalItemsCount} units</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Subtotal:</span>
                <span className="font-mono font-medium">{formatCurrency(sale.subtotal, currency)}</span>
              </div>

              {sale.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>
                    Discount ({sale.discountType === 'PERCENTAGE' ? `${sale.discountValue}%` : 'Fixed'}):
                  </span>
                  <span className="font-mono">-{formatCurrency(sale.discountAmount, currency)}</span>
                </div>
              )}

              {sale.taxAmount > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>Tax ({(sale.taxRate * 100).toFixed(0)}%):</span>
                  <span className="font-mono">{formatCurrency(sale.taxAmount, currency)}</span>
                </div>
              )}

              <div className="border-t-2 border-stone-900 pt-2 flex justify-between text-base font-black text-stone-900 font-display">
                <span>GRAND TOTAL:</span>
                <span className="text-rose-600 font-mono text-lg">{formatCurrency(sale.totalAmount, currency)}</span>
              </div>

              <div className="pt-2 border-t border-dashed border-stone-200 text-stone-500 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span className="font-mono font-semibold text-stone-800">{formatCurrency(sale.amountPaid, currency)}</span>
                </div>
                {sale.changeDue > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Change Returned:</span>
                    <span className="font-mono">{formatCurrency(sale.changeDue, currency)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer & Policies */}
          <div className="border-t border-stone-200 pt-6 text-center space-y-2 text-xs text-stone-600">
            <p className="font-bold text-stone-900 text-sm font-display">
              {store.footerNote || store.receiptFooter || 'Thank you for shopping with us! Visit again. ✨'}
            </p>
            {store.receiptNote && (
              <p className="text-[11px] text-stone-500 max-w-md mx-auto italic">
                {store.receiptNote}
              </p>
            )}
            <div className="pt-3 flex items-center justify-center gap-1.5 text-[10px] text-stone-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified POS Transaction Receipt &bull; {sale.receiptNo}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
