import { Sale, Quotation, StoreSettings } from '@/lib/types';
import { formatDate, formatCurrency, formatItemNameWithWarranty } from '@/lib/formatters';

/**
 * Formats a clean, itemized invoice message for WhatsApp sharing with optional online PDF link.
 */
export function generateWhatsAppInvoiceText(
  sale: Sale,
  settings: StoreSettings,
  invoiceUrl?: string
): string {
  const shopName = settings.shopName || 'Tharu Gift Hub';
  const currencySymbol = settings.currencySymbol || 'LKR';
  const invoiceNo = sale.receiptNo;
  const customerPhone = sale.customerPhone || sale.customer?.phone || 'N/A';
  const formattedDate = formatDate(sale.createdAt);

  const itemsLines = sale.items
    .map((item, index) => {
      const displayName = formatItemNameWithWarranty(item.productName, item.warranty);
      const subtotalFormatted = formatCurrency(item.subtotal, currencySymbol);
      return `${index + 1}. ${displayName} x ${item.quantity} = ${subtotalFormatted}`;
    })
    .join('\n');

  const grandTotalFormatted = formatCurrency(sale.totalAmount, currencySymbol);

  const onlineLinkSection = invoiceUrl 
    ? `\n📄 *View / Download PDF Invoice Online:*\n${invoiceUrl}\n` 
    : '';

  return `🧾 *${shopName} - Official Invoice*
----------------------------------
Invoice No: #${invoiceNo}
Customer Phone: ${customerPhone}
Date: ${formattedDate}

*Items:*
${itemsLines}

----------------------------------
💰 *Grand Total: ${grandTotalFormatted}*
${onlineLinkSection}
Thank you for shopping with ${shopName}!`;
}

/**
 * Formats a clean quotation message for WhatsApp sharing.
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

  return `📋 *${shopName} - Quotation / Proforma Invoice*
----------------------------------
Quotation No: #${quotationNo}
Customer: ${customerName}
Date Issued: ${formattedDate}
Valid Until: ${formattedValidUntil}

*Itemized Estimate:*
${itemsLines}

----------------------------------
💰 *Grand Total: ${grandTotalFormatted}*

*Note:* This quotation is valid for 14 days. Prices subject to inventory availability.
Thank you for choosing ${shopName}!`;
}

/**
 * Cleans phone number and formats it for WhatsApp URL.
 * Automatically handles standard Sri Lankan mobile prefixes (07X -> 947X) if applicable.
 */
export function cleanPhoneNumberForWhatsApp(phone: string): string {
  if (!phone) return '';
  // Remove all non-digits
  let digits = phone.replace(/\D/g, '');

  // If local format like 0712345678 (10 digits starting with 0), convert to 94712345678
  if (digits.length === 10 && digits.startsWith('0')) {
    digits = '94' + digits.substring(1);
  } else if (digits.length === 9 && (digits.startsWith('7') || digits.startsWith('1') || digits.startsWith('2') || digits.startsWith('3') || digits.startsWith('4') || digits.startsWith('5') || digits.startsWith('6') || digits.startsWith('8') || digits.startsWith('9'))) {
    // If entered without leading 0 for Sri Lanka
    digits = '94' + digits;
  }

  return digits;
}

/**
 * Builds direct WhatsApp Web URL.
 * Formats as https://web.whatsapp.com/send?phone=PHONE_NUMBER&text=ENCODED_TEXT
 */
export function getWhatsAppShareUrl(phone: string, text: string): string {
  const cleaned = cleanPhoneNumberForWhatsApp(phone);
  const encodedText = encodeURIComponent(text);
  if (cleaned) {
    return `https://web.whatsapp.com/send?phone=${cleaned}&text=${encodedText}`;
  }
  return `https://web.whatsapp.com/send?text=${encodedText}`;
}

