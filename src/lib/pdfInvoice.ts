import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sale, StoreSettings } from '@/lib/types';
import { formatDate, formatCurrency, formatItemNameWithWarranty } from '@/lib/formatters';

/**
 * Helper to parse Hex color to RGB tuple for jsPDF
 */
function hexToRgb(hex: string | null | undefined, defaultRgb: [number, number, number] = [225, 29, 72]): [number, number, number] {
  if (!hex) return defaultRgb;
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [r, g, b];
  } else if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [r, g, b];
  }
  return defaultRgb;
}

export function buildInvoicePDFDoc(sale: Sale, settings: StoreSettings): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const storeName = settings.shopName || 'Tharu Gift Hub';
  const storeTagline = settings.shopTagline || 'Curated Gifts, Keepsakes & Heartfelt Moments';
  const storeAddress = settings.address || '452 Velvet Lane, West District';
  const storePhone = settings.phone || '+1 (555) 839-4438';
  const storeEmail = settings.email || '';
  const storeLogo = settings.shopLogo;
  const headerNote = settings.headerNote;
  const footerNote = settings.footerNote || settings.receiptFooter || 'Thank you for shopping with us! Visit again. ✨';
  const receiptNote = settings.invoiceTerms || settings.receiptNote || 'Items in original condition can be exchanged within 14 days with this receipt.';
  const bankDetails = settings.bankDetails;
  const currency = settings.currencySymbol || '$';

  const showEmail = settings.showEmailOnInvoice !== false;
  const showPhone = settings.showPhoneOnInvoice !== false;
  const showTagline = settings.showTaglineOnInvoice !== false;
  const showHeaderNote = settings.showHeaderNoteOnInvoice !== false;
  const layoutStyle = settings.invoiceHeaderLayout || 'split';

  // Primary Theme Color
  const primaryRgb = hexToRgb(settings.invoicePrimaryColor, [225, 29, 72]);

  // --- TOP BRAND ACCENT BAR ---
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(0, 0, 210, 6, 'F');

  let headerBottomY = 38;

  // --- HEADER RENDERING BY LAYOUT STYLE ---
  if (layoutStyle === 'centered') {
    // --- CENTERED HEADER STYLE ---
    let currentY = 12;

    if (storeLogo && storeLogo.startsWith('data:image/')) {
      try {
        const imageType = storeLogo.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(storeLogo, imageType, 94, currentY, 22, 22);
        currentY += 25;
      } catch (e) {
        console.warn('Could not render centered logo in PDF:', e);
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(30, 27, 75);
    doc.text(storeName, 105, currentY + 2, { align: 'center' });
    currentY += 6;

    if (showTagline && storeTagline) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(120, 113, 108);
      doc.text(storeTagline, 105, currentY, { align: 'center' });
      currentY += 4;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(87, 83, 78);
    doc.text(storeAddress, 105, currentY, { align: 'center' });
    currentY += 3.5;

    const contactParts: string[] = [];
    if (showPhone && storePhone) contactParts.push(`Tel: ${storePhone}`);
    if (showEmail && storeEmail) contactParts.push(`Email: ${storeEmail}`);
    if (contactParts.length > 0) {
      doc.text(contactParts.join('  |  '), 105, currentY, { align: 'center' });
      currentY += 3.5;
    }

    if (showHeaderNote && headerNote) {
      doc.setFont('helvetica', 'bolditalic');
      doc.setFontSize(7.5);
      doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
      doc.text(`"${headerNote}"`, 105, currentY, { align: 'center' });
      currentY += 4;
    }

    currentY += 2;

    // Centered Invoice Banner Strip
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, currentY, 182, 9, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, 182, 9, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.text('OFFICIAL INVOICE', 18, currentY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 27, 75);
    doc.text(`Invoice #: ${sale.receiptNo}`, 85, currentY + 6, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(87, 83, 78);
    doc.text(`Date: ${formatDate(sale.createdAt)}`, 150, currentY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text('PAID', 190, currentY + 6, { align: 'right' });

    headerBottomY = currentY + 12;
  } else {
    // --- SPLIT 2-COLUMN HEADER (Default Modern Layout) ---
    let brandStartX = 14;
    let currentLeftY = 14;
    const maxLeftWidth = 98; // Strict boundary to guarantee 0% horizontal overlap with right column (X=140-196)

    if (storeLogo && storeLogo.startsWith('data:image/')) {
      try {
        const imageType = storeLogo.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(storeLogo, imageType, 14, 11, 20, 20);
        brandStartX = 37;
      } catch (e) {
        console.warn('Could not render logo in PDF:', e);
      }
    }

    // Store Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(30, 27, 75);
    doc.text(storeName, brandStartX, currentLeftY + 1);
    currentLeftY += 5.5;

    // Tagline
    if (showTagline && storeTagline) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(120, 113, 108);
      const splitTag = doc.splitTextToSize(storeTagline, maxLeftWidth);
      doc.text(splitTag, brandStartX, currentLeftY);
      currentLeftY += splitTag.length * 3.2;
    }

    // Address (Multi-line safe)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(87, 83, 78);
    const splitAddr = doc.splitTextToSize(storeAddress, maxLeftWidth);
    doc.text(splitAddr, brandStartX, currentLeftY);
    currentLeftY += splitAddr.length * 3.2;

    // Phone
    if (showPhone && storePhone) {
      doc.text(`Tel: ${storePhone}`, brandStartX, currentLeftY);
      currentLeftY += 3.2;
    }

    // Email (Multi-line / bounded safe)
    if (showEmail && storeEmail) {
      const splitEmail = doc.splitTextToSize(`Email: ${storeEmail}`, maxLeftWidth);
      doc.text(splitEmail, brandStartX, currentLeftY);
      currentLeftY += splitEmail.length * 3.2;
    }

    // Header Note
    if (showHeaderNote && headerNote) {
      doc.setFont('helvetica', 'bolditalic');
      doc.setFontSize(7);
      doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
      const splitHeaderNote = doc.splitTextToSize(`"${headerNote}"`, maxLeftWidth);
      doc.text(splitHeaderNote, brandStartX, currentLeftY);
      currentLeftY += splitHeaderNote.length * 3.2;
    }

    // Right Column (Invoice Meta Box at X=196)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.text('OFFICIAL INVOICE', 196, 15, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 27, 75);
    doc.text(`Invoice #: ${sale.receiptNo}`, 196, 20.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(87, 83, 78);
    doc.text(`Date: ${formatDate(sale.createdAt)}`, 196, 25.5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(16, 185, 129); // Emerald-600
    doc.text(`Status: PAID (${sale.paymentMethod})`, 196, 30.5, { align: 'right' });

    headerBottomY = Math.max(currentLeftY, 34) + 4;
  }

  // Divider Line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.4);
  doc.line(14, headerBottomY, 196, headerBottomY);

  // --- CUSTOMER & BILLING DETAILS BOX ---
  const boxY = headerBottomY + 3;
  doc.setFillColor(250, 250, 249); // Stone-50
  doc.roundedRect(14, boxY, 182, 20, 2, 2, 'F');
  doc.setDrawColor(231, 229, 228);
  doc.roundedRect(14, boxY, 182, 20, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text('BILLED TO / CUSTOMER DETAILS', 18, boxY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(28, 25, 23);
  const customerName = sale.customerName || 'Walk-in Customer';
  doc.text(`Name: ${customerName}`, 18, boxY + 11);

  const customerPhone = sale.customerPhone || sale.customer?.phone || 'Not provided';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(68, 64, 60);
  doc.text(`Phone / WhatsApp: ${customerPhone}`, 18, boxY + 16);

  // Cashier & Payment Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 113, 108);
  doc.text('PAYMENT & CASHIER', 120, boxY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(68, 64, 60);
  doc.text(`Cashier: ${sale.cashierName || 'Cashier'}`, 120, boxY + 11);
  doc.text(`Payment: ${sale.paymentMethod}`, 120, boxY + 16);

  // --- ITEMS TABLE ---
  const tableData = sale.items.map((item, index) => [
    index + 1,
    formatItemNameWithWarranty(item.productName, item.warranty),
    item.productSku,
    item.quantity,
    formatCurrency(item.unitPrice, currency),
    formatCurrency(item.subtotal, currency),
  ]);

  autoTable(doc, {
    startY: boxY + 24,
    head: [['#', 'Item Description', 'SKU', 'Qty', 'Unit Price', 'Subtotal']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryRgb,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.4,
      textColor: [28, 25, 23],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 72 },
      2: { cellWidth: 30, fontStyle: 'italic', textColor: [120, 113, 108] },
      3: { halign: 'center', cellWidth: 15 },
      4: { halign: 'right', cellWidth: 25 },
      5: { halign: 'right', cellWidth: 30, fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [253, 251, 249],
    },
  });

  // Get Y position after table
  const finalY = (doc as any).lastAutoTable?.finalY || 135;

  // --- FINANCIAL SUMMARY & NOTES/BANK DETAILS ---
  const summaryX = 120;
  const summaryWidth = 76;
  let currentSummaryY = finalY + 5;
  let leftSideY = finalY + 5;

  // Left Side: Order Notes
  if (sale.notes) {
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(14, leftSideY, 95, 16, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.text('Order Note / Gift Tag:', 18, leftSideY + 5);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(87, 83, 78);
    const splitNote = doc.splitTextToSize(sale.notes, 87);
    doc.text(splitNote, 18, leftSideY + 10);
    leftSideY += 19;
  }

  // Left Side: Bank Transfer Details if configured
  if (bankDetails) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, leftSideY, 95, 20, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, leftSideY, 95, 20, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 27, 75);
    doc.text('Bank Transfer & Payment Details:', 18, leftSideY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    const splitBank = doc.splitTextToSize(bankDetails, 87);
    doc.text(splitBank, 18, leftSideY + 10);
    leftSideY += 23;
  }

  // Summary Lines (Right side)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(87, 83, 78);

  // Subtotal
  doc.text('Subtotal:', summaryX, currentSummaryY);
  doc.text(formatCurrency(sale.subtotal, currency), 196, currentSummaryY, { align: 'right' });
  currentSummaryY += 4.5;

  // Discount
  if (sale.discountAmount > 0) {
    doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.text(`Discount (${sale.discountType === 'PERCENTAGE' ? `${sale.discountValue}%` : 'Fixed'}):`, summaryX, currentSummaryY);
    doc.text(`-${formatCurrency(sale.discountAmount, currency)}`, 196, currentSummaryY, { align: 'right' });
    currentSummaryY += 4.5;
    doc.setTextColor(87, 83, 78);
  }

  // Tax
  if (sale.taxAmount > 0) {
    doc.text(`Tax (${(sale.taxRate * 100).toFixed(0)}%):`, summaryX, currentSummaryY);
    doc.text(formatCurrency(sale.taxAmount, currency), 196, currentSummaryY, { align: 'right' });
    currentSummaryY += 4.5;
  }

  // Grand Total Box
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.roundedRect(summaryX - 2, currentSummaryY, summaryWidth, 9, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text('GRAND TOTAL:', summaryX + 2, currentSummaryY + 6);
  doc.text(formatCurrency(sale.totalAmount, currency), 194, currentSummaryY + 6, { align: 'right' });
  currentSummaryY += 12;

  // Payment Breakdown
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 113, 108);
  doc.text(`Amount Paid: ${formatCurrency(sale.amountPaid, currency)}`, summaryX, currentSummaryY);
  if (sale.changeDue > 0) {
    doc.text(`Change Due: ${formatCurrency(sale.changeDue, currency)}`, 196, currentSummaryY, { align: 'right' });
  }

  // --- FOOTER & POLICIES ---
  const footerY = 270;
  doc.setDrawColor(229, 231, 235);
  doc.line(14, footerY, 196, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(28, 25, 23);
  doc.text(footerNote, 105, footerY + 5.5, { align: 'center' });

  if (receiptNote) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(120, 113, 108);
    const splitTerms = doc.splitTextToSize(receiptNote, 170);
    doc.text(splitTerms, 105, footerY + 10, { align: 'center' });
  }

  return doc;
}

export function generateInvoicePDF(sale: Sale, settings: StoreSettings) {
  const doc = buildInvoicePDFDoc(sale, settings);
  const filename = `Invoice-${sale.receiptNo}.pdf`;
  doc.save(filename);
}

export function createInvoicePDFBlob(sale: Sale, settings: StoreSettings): Blob {
  const doc = buildInvoicePDFDoc(sale, settings);
  return doc.output('blob');
}
