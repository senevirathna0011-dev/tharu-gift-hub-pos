import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quotation, StoreSettings } from '@/lib/types';
import { formatDate, formatCurrency, formatItemNameWithWarranty } from '@/lib/formatters';

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
  const storeEmail = settings.email || 'hello@blissandbloomgifts.com';
  const storeLogo = settings.shopLogo;
  const currency = settings.currencySymbol || '$';

  // --- BRAND HEADER BANNER ---
  doc.setFillColor(225, 29, 72); // Rose-600
  doc.rect(0, 0, 210, 8, 'F');

  // --- LOGO OR BRAND TEXT ---
  let brandStartX = 14;
  let textStartY = 20;

  if (storeLogo) {
    try {
      if (storeLogo.startsWith('data:image/')) {
        const imageType = storeLogo.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(storeLogo, imageType, 14, 12, 22, 22);
        brandStartX = 40;
      }
    } catch (e) {
      console.warn('Could not render logo in Quotation PDF:', e);
    }
  }

  // Store Brand Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 27, 75); // Dark Slate
  doc.text(storeName, brandStartX, textStartY + 2);

  if (storeTagline) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(120, 113, 108);
    doc.text(storeTagline, brandStartX, textStartY + 7);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(87, 83, 78);
  doc.text(`${storeAddress}  |  Tel: ${storePhone}${storeEmail ? `  |  ${storeEmail}` : ''}`, brandStartX, textStartY + 12);

  // --- QUOTATION BADGE (Right aligned) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(225, 29, 72); // Rose-600
  doc.text('PROFORMA INVOICE', 196, 20, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 27, 75);
  doc.text(`Quotation #: ${quotation.quotationNo}`, 196, 26, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(87, 83, 78);
  doc.text(`Date Issued: ${formatDate(quotation.createdAt)}`, 196, 31, { align: 'right' });
  doc.setTextColor(225, 29, 72);
  doc.text(`Valid Until: ${formatDate(quotation.validUntil)}`, 196, 36, { align: 'right' });

  // Divider Line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(14, 41, 196, 41);

  // --- CLIENT DETAILS BOX ---
  doc.setFillColor(250, 250, 249); // Stone-50
  doc.roundedRect(14, 44, 182, 22, 2, 2, 'F');
  doc.setDrawColor(231, 229, 228);
  doc.roundedRect(14, 44, 182, 22, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(168, 85, 247); // Purple
  doc.text('BILL TO / CLIENT DETAILS', 18, 50);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(28, 25, 23);
  const customerName = quotation.customerName || 'Valued Customer';
  doc.text(`Client Name: ${customerName}`, 18, 56);

  const customerPhone = quotation.customerPhone || 'Not provided';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(68, 64, 60);
  doc.text(`Phone / WhatsApp: ${customerPhone}`, 18, 61);

  // Additional Client Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(120, 113, 108);
  doc.text('QUOTATION DETAILS', 120, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(68, 64, 60);
  if (quotation.customerEmail) {
    doc.text(`Email: ${quotation.customerEmail}`, 120, 56);
  } else {
    doc.text(`Status: Pending Approval`, 120, 56);
  }
  if (quotation.customerAddress) {
    doc.text(`Address: ${quotation.customerAddress}`, 120, 61);
  } else {
    doc.text(`Validity: 14 Days from issue`, 120, 61);
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
    startY: 70,
    head: [['#', 'Item Description', 'SKU', 'Qty', 'Unit Price', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [225, 29, 72], // Rose-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.8,
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

  // --- FINANCIAL SUMMARY BOX (Right Aligned) ---
  const summaryX = 120;
  const summaryWidth = 76;
  let currentY = finalY + 6;

  // Notes if any (Left side)
  if (quotation.notes) {
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(14, currentY, 95, 20, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(225, 29, 72);
    doc.text('Quotation Notes / Remarks:', 18, currentY + 6);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(87, 83, 78);
    const splitNote = doc.splitTextToSize(quotation.notes, 87);
    doc.text(splitNote, 18, currentY + 12);
  }

  // Summary Lines
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(87, 83, 78);

  // Subtotal
  doc.text('Subtotal:', summaryX, currentY);
  doc.text(formatCurrency(quotation.subtotal, currency), 196, currentY, { align: 'right' });
  currentY += 5;

  // Discount
  if (quotation.discountAmount > 0) {
    doc.setTextColor(225, 29, 72);
    doc.text(`Discount (${quotation.discountType === 'PERCENTAGE' ? `${quotation.discountValue}%` : 'Fixed'}):`, summaryX, currentY);
    doc.text(`-${formatCurrency(quotation.discountAmount, currency)}`, 196, currentY, { align: 'right' });
    currentY += 5;
    doc.setTextColor(87, 83, 78);
  }

  // Tax
  if (quotation.taxAmount > 0) {
    doc.text(`Tax (${(quotation.taxRate * 100).toFixed(0)}%):`, summaryX, currentY);
    doc.text(formatCurrency(quotation.taxAmount, currency), 196, currentY, { align: 'right' });
    currentY += 5;
  }

  // Grand Total Box
  doc.setFillColor(225, 29, 72); // Rose-600
  doc.roundedRect(summaryX - 2, currentY, summaryWidth, 9.5, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text('ESTIMATED TOTAL:', summaryX + 2, currentY + 6.5);
  doc.text(formatCurrency(quotation.totalAmount, currency), 194, currentY + 6.5, { align: 'right' });
  currentY += 16;

  // --- TERMS & CONDITIONS BOX ---
  const termsY = Math.max(currentY, 220);
  doc.setFillColor(254, 243, 199); // Amber-100
  doc.roundedRect(14, termsY, 182, 22, 2, 2, 'F');
  doc.setDrawColor(251, 191, 36);
  doc.roundedRect(14, termsY, 182, 22, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9); // Amber-700
  doc.text('TERMS & CONDITIONS:', 18, termsY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 53, 15);
  doc.text('1. This quotation is valid for 14 days from date of issue.', 18, termsY + 10.5);
  doc.text('2. Prices are subject to change without prior notice and based on stock availability.', 18, termsY + 15);
  doc.text('3. This proforma invoice is an estimate and does not reserve inventory until payment confirmation.', 18, termsY + 19.5);

  // --- SIGNATURES ---
  const signY = 258;
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
  const footerY = 275;
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
