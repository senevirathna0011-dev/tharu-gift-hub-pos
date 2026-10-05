import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { QuotationPayload } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const quotations = await prisma.quotation.findMany({
      include: {
        items: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, quotations });
  } catch (error: any) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch quotations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: QuotationPayload = await request.json();
    const {
      items,
      customerId,
      customerName = 'Valued Customer',
      customerPhone = '',
      customerEmail = '',
      customerAddress = '',
      discountType = 'NONE',
      discountValue = 0,
      taxRate = 0.08,
      notes = '',
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty. Add products to generate quotation.' },
        { status: 400 }
      );
    }

    // Calculate financials
    let subtotal = 0;
    const quotationItemsData = items.map((item) => {
      const itemSubtotal = +(item.unitPrice * item.quantity).toFixed(2);
      subtotal += itemSubtotal;

      const cleanWarranty = (item as any).warranty;
      const displayName = cleanWarranty && !item.productName.toLowerCase().includes('warranty')
        ? `${item.productName} (${cleanWarranty.trim()} Warranty)`
        : item.productName;

      return {
        productId: item.productId || null,
        productName: displayName,
        productSku: item.productSku,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        subtotal: itemSubtotal,
      };
    });

    subtotal = +subtotal.toFixed(2);

    let discountAmount = 0;
    if (discountType === 'PERCENTAGE' && discountValue > 0) {
      discountAmount = +(subtotal * (discountValue / 100)).toFixed(2);
    } else if (discountType === 'FIXED' && discountValue > 0) {
      discountAmount = +Math.min(subtotal, discountValue).toFixed(2);
    }

    const discountedSubtotal = Math.max(0, +(subtotal - discountAmount).toFixed(2));
    const effectiveTaxRate = Number(taxRate) || 0;
    const taxAmount = +(discountedSubtotal * effectiveTaxRate).toFixed(2);
    const totalAmount = +(discountedSubtotal + taxAmount).toFixed(2);

    // 14 days validity
    const now = new Date();
    const validUntil = new Date(now);
    validUntil.setDate(validUntil.getDate() + 14);

    // Generate Quotation Number QTN-YYYYMMDD-XXXX
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const countToday = await prisma.quotation.count({
      where: {
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        },
      },
    });
    const seq = String(countToday + 1).padStart(4, '0');
    const quotationNo = `QTN-${dateStr}-${seq}`;

    // Note: Quotation does NOT deduct stock
    const quotation = await prisma.quotation.create({
      data: {
        quotationNo,
        customerId: customerId || null,
        customerName: customerName.trim() || 'Valued Customer',
        customerPhone: customerPhone?.trim() || null,
        customerEmail: customerEmail?.trim() || null,
        customerAddress: customerAddress?.trim() || null,
        subtotal,
        discountType,
        discountValue: Number(discountValue) || 0,
        discountAmount,
        taxRate: effectiveTaxRate,
        taxAmount,
        totalAmount,
        notes: notes?.trim() || null,
        validUntil,
        items: {
          create: quotationItemsData,
        },
      },
      include: {
        items: true,
        customer: true,
      },
    });

    return NextResponse.json({
      success: true,
      quotation,
      message: 'Quotation generated successfully!',
    });
  } catch (error: any) {
    console.error('Error generating quotation:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate quotation' },
      { status: 500 }
    );
  }
}
