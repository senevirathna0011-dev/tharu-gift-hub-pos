import { Sale, Quotation, StoreSettings } from '@/lib/types';
import { formatDate, formatCurrency, formatItemNameWithWarranty } from '@/lib/formatters';

/**
 * Checks if the current browser environment is a mobile device (Android / iOS).
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(ua);
}

/**
 * Formats a clean, itemized invoice message for WhatsApp sharing without any web/Vercel URLs.
 */
export function generateWhatsAppInvoiceText(
  sale: Sale,
  settings: StoreSettings
): string {
  const shopName = settings.shopName || 'Tharu Gift Hub';
  const currencySymbol = settings.currencySymbol || 'LKR';
  const invoiceNo = sale.receiptNo;
  const customerPhone = sale.customerPhone || sale.customer?.phone || '';
  const formattedDate = formatDate(sale.createdAt);

  const itemsLines = sale.items
    .map((item, index) => {
      const displayName = formatItemNameWithWarranty(item.productName, item.warranty);
      const subtotalFormatted = formatCurrency(item.subtotal, currencySymbol);
      return `${index + 1}. ${displayName} x ${item.quantity} = ${subtotalFormatted}`;
    })
    .join('\n');

  const grandTotalFormatted = formatCurrency(sale.totalAmount, currencySymbol);

  let text = `🧾 *${shopName} - Official Invoice*\n`;
  text += `----------------------------------\n`;
  text += `Invoice No: #${invoiceNo}\n`;
  if (customerPhone) {
    text += `Customer Phone: ${customerPhone}\n`;
  }
  text += `Date: ${formattedDate}\n\n`;
  text += `*Purchased Items:*\n`;
  text += `${itemsLines}\n\n`;
  text += `----------------------------------\n`;
  text += `💰 *Grand Total: ${grandTotalFormatted}*\n\n`;
  text += `Thank you for shopping with ${shopName}!`;

  return text;
}

/**
 * Formats a clean quotation message for WhatsApp sharing without any web/Vercel URLs.
 */
export function generateWhatsAppQuotationText(
  quotation: Quotation,
  settings: StoreSettings
): string {
  const shopName = settings.shopName || 'Tharu Gift Hub';
  const currencySymbol = settings.currencySymbol || 'LKR';
  const quotationNo = quotation.quotationNo;
  const customerName = quotation.customerName || 'Valued Customer';
  const formattedDate = formatDate(quotation.createdAt);
  const formattedValidUntil = formatDate(quotation.validUntil);

  const itemsLines = quotation.items
    .map((item, index) => {
      const displayName = formatItemNameWithWarranty(item.productName, item.warranty);
      const subtotalFormatted = formatCurrency(item.subtotal, currencySymbol);
      return `${index + 1}. ${displayName} (SKU: ${item.productSku}) x ${item.quantity} = ${subtotalFormatted}`;
    })
    .join('\n');

  const grandTotalFormatted = formatCurrency(quotation.totalAmount, currencySymbol);

  let text = `📋 *${shopName} - Quotation / Proforma Invoice*\n`;
  text += `----------------------------------\n`;
  text += `Quotation No: #${quotationNo}\n`;
  text += `Customer: ${customerName}\n`;
  text += `Date Issued: ${formattedDate}\n`;
  text += `Valid Until: ${formattedValidUntil}\n\n`;
  text += `*Itemized Estimate:*\n`;
  text += `${itemsLines}\n\n`;
  text += `----------------------------------\n`;
  text += `💰 *Grand Total: ${grandTotalFormatted}*\n\n`;
  text += `*Note:* Valid for 14 days. Prices subject to inventory availability.\n`;
  text += `Thank you for choosing ${shopName}!`;

  return text;
}

/**
 * Cleans phone number and formats it for WhatsApp Web URL.
 * Automatically handles standard Sri Lankan mobile prefixes (07X -> 947X) if applicable.
 */
export function cleanPhoneNumberForWhatsApp(phone: string): string {
  if (!phone) return '';
  // Remove all non-digits
  let digits = phone.replace(/\D/g, '');

  // If local format like 0712345678 (10 digits starting with 0), convert to 94712345678
  if (digits.length === 10 && digits.startsWith('0')) {
    digits = '94' + digits.substring(1);
  } else if (
    digits.length === 9 &&
    (digits.startsWith('7') ||
      digits.startsWith('1') ||
      digits.startsWith('2') ||
      digits.startsWith('3') ||
      digits.startsWith('4') ||
      digits.startsWith('5') ||
      digits.startsWith('6') ||
      digits.startsWith('8') ||
      digits.startsWith('9'))
  ) {
    // If entered without leading 0 for Sri Lanka
    digits = '94' + digits;
  }

  return digits;
}

/**
 * Strictly builds direct WhatsApp Web URL: https://web.whatsapp.com/send
 * This avoids OS desktop application protocol handlers (such as wa.me or api.whatsapp.com).
 */
export function getWhatsAppShareUrl(phone: string, text: string): string {
  const cleaned = cleanPhoneNumberForWhatsApp(phone);
  const encodedText = encodeURIComponent(text);
  if (cleaned) {
    return `https://web.whatsapp.com/send?phone=${cleaned}&text=${encodedText}`;
  }
  return `https://web.whatsapp.com/send?text=${encodedText}`;
}

export interface SharePdfOptions {
  phone: string;
  text: string;
  pdfBlob: Blob;
  fileName: string;
  dialogTitle: string;
  onDesktopFallback?: () => void;
  onMobileShared?: () => void;
}

/**
 * Handles PDF sharing via WhatsApp:
 * - Mobile (Android/iOS with Web Share API file support): Shares the PDF file directly via native share sheet / WhatsApp.
 * - Desktop: Strictly opens WhatsApp Web (https://web.whatsapp.com/send) in a new browser tab and simultaneously auto-downloads the PDF.
 */
export async function sharePdfDocumentViaWhatsApp({
  phone,
  text,
  pdfBlob,
  fileName,
  dialogTitle,
  onDesktopFallback,
  onMobileShared,
}: SharePdfOptions): Promise<void> {
  const isMobile = isMobileDevice();

  if (isMobile) {
    let fileToShare: File | null = null;
    try {
      fileToShare = new File([pdfBlob], fileName, { type: 'application/pdf' });
    } catch (e) {
      fileToShare = null;
    }

    if (
      fileToShare &&
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function'
    ) {
      try {
        if (navigator.canShare({ files: [fileToShare] })) {
          await navigator.share({
            files: [fileToShare],
            title: dialogTitle,
            text: text,
          });
          if (onMobileShared) {
            onMobileShared();
          }
          return;
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // User voluntarily dismissed share sheet
          return;
        }
        console.warn('Mobile file share failed, falling back to desktop flow:', err);
      }
    }
  }

  // Desktop Flow (Strict WhatsApp Web in browser tab + Auto-download PDF)
  // 1. Strictly construct WhatsApp Web URL
  const waUrl = getWhatsAppShareUrl(phone, text);

  // 2. Open WhatsApp Web in a new tab immediately in response to the user click
  window.open(waUrl, '_blank', 'noopener,noreferrer');

  // 3. Simultaneously auto-download the PDF to local device
  const blobUrl = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

  // 4. Trigger feedback notification
  if (onDesktopFallback) {
    onDesktopFallback();
  }
}
