import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sale, StoreSettings } from '@/lib/types';
import { formatDate, formatCurrency } from '@/lib/formatters';

export function generateInvoicePDF(sale: Sale, settings: StoreSettings) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const storeName = settings.shopName || 'Tharu Gift Hub';
  const storeTagline = settings.shopTagline || 'Curated Gifts, Keepsakes & Heartfelt Moments';
  const storeAddress = settings.address || '452 Velvet Lane, West District';
  const storePhone = settings.phone || '+1 (555) 839-4438';
  const storeEmail = settings.email || 'orders@blissandbloomgifts.com';
  const currency = settings.currencySymbol || 'LKR';

  // --- BRAND HEADER ---
  // Header background banner
  doc.setFillColor(244, 63, 94); // Rose-500
  doc.rect(0, 0, 210, 10, 'F');

  // Store Brand Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(30, 27, 75); // Dark Slate
  doc.text(storeName, 14, 25);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(120, 113, 108);
  doc.text(storeTagline, 14, 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(87, 83, 78);
  doc.text(`${storeAddress}  |  Tel: ${storePhone}${storeEmail ? `  |  ${storeEmail}` : ''}`, 14, 35);

  // --- INVOICE BADGE (Right aligned) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(225, 29, 72); // Rose-600
  doc.text('OFFICIAL INVOICE', 196, 25, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 27, 75);
  doc.text(`Invoice #: ${sale.receiptNo}`, 196, 31, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(87, 83, 78);
  doc.text(`Date: ${formatDate(sale.createdAt)}`, 196, 36, { align: 'right' });

  // Divider Line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(14, 40, 196, 40);

  // --- CUSTOMER & BILLING DETAILS BOX ---
  doc.setFillColor(250, 250, 249); // Stone-50
  doc.roundedRect(14, 44, 182, 22, 2, 2, 'F');
  doc.setDrawColor(231, 229, 228);
  doc.roundedRect(14, 44, 182, 22, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(168, 85, 247); // Purple
  doc.text('BILL TO / CUSTOMER DETAILS', 18, 50);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(28, 25, 23);
  const customerName = sale.customerName || 'Walk-in Customer';
  doc.text(`Name: ${customerName}`, 18, 56);

  const customerPhone = sale.customerPhone || sale.customer?.phone || 'Not provided';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(68, 64, 60);
  doc.text(`Phone / WhatsApp: ${customerPhone}`, 18, 61);

  // Cashier Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(120, 113, 108);
  doc.text('PAYMENT & CASHIER', 120, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(68, 64, 60);
  doc.text(`Cashier: ${sale.cashierName || 'Cashier'}`, 120, 56);
  doc.text(`Method: ${sale.paymentMethod}`, 120, 61);

  // --- ITEMS TABLE ---
  const tableData = sale.items.map((item, index) => [
    index + 1,
    item.productName,
    item.productSku,
    item.quantity,
    formatCurrency(item.unitPrice, currency),
    formatCurrency(item.subtotal, currency),
  ]);

  autoTable(doc, {
    startY: 71,
    head: [['#', 'Item Description', 'SKU', 'Qty', 'Unit Price', 'Subtotal']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [225, 29, 72], // Rose-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
    },
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 3,
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
  const finalY = (doc as any).lastAutoTable?.finalY || 140;

  // --- FINANCIAL SUMMARY BOX (Right Aligned) ---
  const summaryX = 120;
  const summaryWidth = 76;
  let currentY = finalY + 8;

  // Notes if any (Left side)
  if (sale.notes) {
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(14, currentY, 95, 20, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(225, 29, 72);
    doc.text('Order Note / Gift Tag:', 18, currentY + 6);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(87, 83, 78);
    const splitNote = doc.splitTextToSize(sale.notes, 87);
    doc.text(splitNote, 18, currentY + 12);
  }

  // Summary Lines
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(87, 83, 78);

  // Subtotal
  doc.text('Subtotal:', summaryX, currentY);
  doc.text(formatCurrency(sale.subtotal, currency), 196, currentY, { align: 'right' });
  currentY += 5;

  // Discount
  if (sale.discountAmount > 0) {
    doc.setTextColor(225, 29, 72);
    doc.text(`Discount (${sale.discountType === 'PERCENTAGE' ? `${sale.discountValue}%` : 'Fixed'}):`, summaryX, currentY);
    doc.text(`-${formatCurrency(sale.discountAmount, currency)}`, 196, currentY, { align: 'right' });
    currentY += 5;
    doc.setTextColor(87, 83, 78);
  }

  // Tax
  if (sale.taxAmount > 0) {
    doc.text(`Tax (${(sale.taxRate * 100).toFixed(0)}%):`, summaryX, currentY);
    doc.text(formatCurrency(sale.taxAmount, currency), 196, currentY, { align: 'right' });
    currentY += 5;
  }

  // Grand Total Box
  doc.setFillColor(244, 63, 94); // Rose-500
  doc.roundedRect(summaryX - 2, currentY, summaryWidth, 10, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('GRAND TOTAL:', summaryX + 2, currentY + 6.5);
  doc.text(formatCurrency(sale.totalAmount, currency), 194, currentY + 6.5, { align: 'right' });
  currentY += 14;

  // Payment Breakdown
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 113, 108);
  doc.text(`Amount Paid: ${formatCurrency(sale.amountPaid, currency)}`, summaryX, currentY);
  if (sale.changeDue > 0) {
    doc.text(`Change Due: ${formatCurrency(sale.changeDue, currency)}`, 196, currentY, { align: 'right' });
  }

  // --- FOOTER & POLICIES ---
  const footerY = 270;
  doc.setDrawColor(229, 231, 235);
  doc.line(14, footerY, 196, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(28, 25, 23);
  doc.text(settings.receiptFooter || 'Thank you for shopping with Tharu Gift Hub!', 105, footerY + 6, { align: 'center' });

  if (settings.receiptNote) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 113, 108);
    doc.text(settings.receiptNote, 105, footerY + 11, { align: 'center' });
  }

  // Save the PDF
  const filename = `Invoice-${sale.receiptNo}.pdf`;
  doc.save(filename);
}
