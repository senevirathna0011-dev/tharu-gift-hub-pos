import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quotation, StoreSettings } from '@/lib/types';
import { formatDate, formatCurrency, formatItemNameWithWarranty } from '@/lib/formatters';

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

export function buildQuotationPDFDoc(quotation: Quotation, settings: StoreSettings): jsPDF {
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
  const bankDetails = settings.bankDetails;
  const currency = settings.currencySymbol || '$';

  const showEmail = settings.showEmailOnInvoice !== false;
  const showPhone = settings.showPhoneOnInvoice !== false;
  const showTagline = settings.showTaglineOnInvoice !== false;
  const showHeaderNote = settings.showHeaderNoteOnInvoice !== false;
  const layoutStyle = settings.invoiceHeaderLayout || 'split';

  const primaryRgb = hexToRgb(settings.invoicePrimaryColor, [225, 29, 72]);

  // --- TOP BRAND ACCENT BAR ---
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(0, 0, 210, 6, 'F');

  let headerBottomY = 38;

  if (layoutStyle === 'centered') {
    let currentY = 12;

    if (storeLogo && storeLogo.startsWith('data:image/')) {
      try {
        const imageType = storeLogo.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(storeLogo, imageType, 94, currentY, 22, 22);
        currentY += 25;
      } catch (e) {
        console.warn('Could not render logo in Quotation PDF:', e);
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

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, currentY, 182, 9, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, 182, 9, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.text('PROFORMA INVOICE', 18, currentY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 27, 75);
    doc.text(`Quotation #: ${quotation.quotationNo}`, 85, currentY + 6, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(87, 83, 78);
    doc.text(`Valid Until: ${formatDate(quotation.validUntil)}`, 150, currentY + 6);

    headerBottomY = currentY + 12;
  } else {
    // --- SPLIT 2-COLUMN HEADER ---
    let brandStartX = 14;
    let currentLeftY = 14;
    const maxLeftWidth = 98;

    if (storeLogo && storeLogo.startsWith('data:image/')) {
      try {
        const imageType = storeLogo.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(storeLogo, imageType, 14, 11, 20, 20);
        brandStartX = 37;
      } catch (e) {
        console.warn('Could not render logo in Quotation PDF:', e);
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(30, 27, 75);
    doc.text(storeName, brandStartX, currentLeftY + 1);
    currentLeftY += 5.5;

    if (showTagline && storeTagline) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(120, 113, 108);
      const splitTag = doc.splitTextToSize(storeTagline, maxLeftWidth);
      doc.text(splitTag, brandStartX, currentLeftY);
      currentLeftY += splitTag.length * 3.2;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(87, 83, 78);
    const splitAddr = doc.splitTextToSize(storeAddress, maxLeftWidth);
    doc.text(splitAddr, brandStartX, currentLeftY);
    currentLeftY += splitAddr.length * 3.2;

    if (showPhone && storePhone) {
      doc.text(`Tel: ${storePhone}`, brandStartX, currentLeftY);
      currentLeftY += 3.2;
    }

    if (showEmail && storeEmail) {
      const splitEmail = doc.splitTextToSize(`Email: ${storeEmail}`, maxLeftWidth);
      doc.text(splitEmail, brandStartX, currentLeftY);
      currentLeftY += splitEmail.length * 3.2;
    }

    if (showHeaderNote && headerNote) {
      doc.setFont('helvetica', 'bolditalic');
      doc.setFontSize(7);
      doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
      const splitHeaderNote = doc.splitTextToSize(`"${headerNote}"`, maxLeftWidth);
      doc.text(splitHeaderNote, brandStartX, currentLeftY);
      currentLeftY += splitHeaderNote.length * 3.2;
    }

    // Right Column (Quotation Meta Box)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.text('PROFORMA INVOICE', 196, 15, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 27, 75);
    doc.text(`Quotation #: ${quotation.quotationNo}`, 196, 20.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(87, 83, 78);
    doc.text(`Date Issued: ${formatDate(quotation.createdAt)}`, 196, 25.5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.text(`Valid Until: ${formatDate(quotation.validUntil)}`, 196, 30.5, { align: 'right' });

    headerBottomY = Math.max(currentLeftY, 34) + 4;
  }

  // Divider Line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.4);
  doc.line(14, headerBottomY, 196, headerBottomY);

  // --- CLIENT DETAILS BOX ---
  const boxY = headerBottomY + 3;
  doc.setFillColor(250, 250, 249);
  doc.roundedRect(14, boxY, 182, 20, 2, 2, 'F');
  doc.setDrawColor(231, 229, 228);
  doc.roundedRect(14, boxY, 182, 20, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text('BILL TO / CLIENT DETAILS', 18, boxY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(28, 25, 23);
  const customerName = quotation.customerName || 'Valued Customer';
  doc.text(`Client Name: ${customerName}`, 18, boxY + 11);

  const customerPhone = quotation.customerPhone || 'Not provided';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(68, 64, 60);
  doc.text(`Phone / WhatsApp: ${customerPhone}`, 18, boxY + 16);

  // Additional Client Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 113, 108);
  doc.text('QUOTATION DETAILS', 120, boxY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(68, 64, 60);
  if (quotation.customerEmail) {
    doc.text(`Email: ${quotation.customerEmail}`, 120, boxY + 11);
  } else {
    doc.text(`Status: Pending Approval`, 120, boxY + 11);
  }
  if (quotation.customerAddress) {
    doc.text(`Address: ${quotation.customerAddress}`, 120, boxY + 16);
  } else {
    doc.text(`Validity: 14 Days from issue`, 120, boxY + 16);
  }

  // --- ITEMS TABLE ---
  const tableData = quotation.items.map((item, index) => [
    index + 1,
    formatItemNameWithWarranty(item.productName, item.warranty),
    item.productSku,
    item.quantity,
    formatCurrency(item.unitPrice, currency),
    formatCurrency(item.subtotal, currency),
  ]);

  autoTable(doc, {
    startY: boxY + 24,
    head: [['#', 'Item Description', 'SKU', 'Qty', 'Unit Price', 'Amount']],
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

  const finalY = (doc as any).lastAutoTable?.finalY || 135;

  const summaryX = 120;
  const summaryWidth = 76;
  let currentSummaryY = finalY + 5;
  let leftSideY = finalY + 5;

  if (quotation.notes) {
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(14, leftSideY, 95, 16, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.text('Quotation Remarks:', 18, leftSideY + 5);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(87, 83, 78);
    const splitNote = doc.splitTextToSize(quotation.notes, 87);
    doc.text(splitNote, 18, leftSideY + 10);
    leftSideY += 19;
  }

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

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(87, 83, 78);

  // Subtotal
  doc.text('Subtotal:', summaryX, currentSummaryY);
  doc.text(formatCurrency(quotation.subtotal, currency), 196, currentSummaryY, { align: 'right' });
  currentSummaryY += 4.5;

  // Discount
  if (quotation.discountAmount > 0) {
    doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.text(`Discount (${quotation.discountType === 'PERCENTAGE' ? `${quotation.discountValue}%` : 'Fixed'}):`, summaryX, currentSummaryY);
    doc.text(`-${formatCurrency(quotation.discountAmount, currency)}`, 196, currentSummaryY, { align: 'right' });
    currentSummaryY += 4.5;
    doc.setTextColor(87, 83, 78);
  }

  // Tax
  if (quotation.taxAmount > 0) {
    doc.text(`Tax (${(quotation.taxRate * 100).toFixed(0)}%):`, summaryX, currentSummaryY);
    doc.text(formatCurrency(quotation.taxAmount, currency), 196, currentSummaryY, { align: 'right' });
    currentSummaryY += 4.5;
  }

  // Grand Total Box
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.roundedRect(summaryX - 2, currentSummaryY, summaryWidth, 9, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text('ESTIMATED TOTAL:', summaryX + 2, currentSummaryY + 6);
  doc.text(formatCurrency(quotation.totalAmount, currency), 194, currentSummaryY + 6, { align: 'right' });
  currentSummaryY += 14;

  // --- TERMS & CONDITIONS BOX ---
  const termsY = Math.max(currentSummaryY + 2, leftSideY + 2, 215);
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(14, termsY, 182, 20, 2, 2, 'F');
  doc.setDrawColor(251, 191, 36);
  doc.roundedRect(14, termsY, 182, 20, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9);
  doc.text('TERMS & CONDITIONS:', 18, termsY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 53, 15);
  doc.text('1. This quotation is valid for 14 days from date of issue.', 18, termsY + 9.5);
  doc.text('2. Prices are subject to change without prior notice and based on stock availability.', 18, termsY + 13.5);
  doc.text('3. This proforma invoice is an estimate and does not reserve inventory until payment confirmation.', 18, termsY + 17.5);

  // --- SIGNATURES ---
  const signY = 252;
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.4);
  doc.line(20, signY, 80, signY);
  doc.line(130, signY, 190, signY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  doc.text('Authorized Signature & Stamp', 50, signY + 4, { align: 'center' });
  doc.text('Customer Acceptance (Sign & Date)', 160, signY + 4, { align: 'center' });

  // --- FOOTER NOTE ---
  const footerY = 272;
  doc.setDrawColor(229, 231, 235);
  doc.line(14, footerY, 196, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(28, 25, 23);
  doc.text(`Thank you for choosing ${storeName}!`, 105, footerY + 5, { align: 'center' });

  return doc;
}

export function generateQuotationPDF(quotation: Quotation, settings: StoreSettings) {
  const doc = buildQuotationPDFDoc(quotation, settings);
  const filename = `Quotation_${quotation.quotationNo}.pdf`;
  doc.save(filename);
}

export function createQuotationPDFBlob(quotation: Quotation, settings: StoreSettings): Blob {
  const doc = buildQuotationPDFDoc(quotation, settings);
  return doc.output('blob');
}
