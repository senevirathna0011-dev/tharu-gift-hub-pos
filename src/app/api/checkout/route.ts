import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CheckoutPayload } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutPayload = await request.json();
    const {
      items,
      customerId,
      customerName = 'Walk-in Customer',
      cashierId = null,
      cashierName = 'Cashier',
      discountType = 'NONE',
      discountValue = 0,
      taxRate = 0.08,
      paymentMethod = 'CASH',
      amountPaid = 0,
      notes = '',
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty. Add products before checking out.' },
        { status: 400 }
      );
    }

    // Step 1: Validate stock & fetch fresh product snapshots
    const productIds = items.map((i) => i.productId);
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(existingProducts.map((p) => [p.id, p]));

    // Check stock availability
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product not found for ID: ${item.productId}` },
          { status: 404 }
        );
      }

      if (product.stockQuantity < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, Requested: ${item.quantity}`,
          },
          { status: 400 }
        );
      }
    }

    // Step 2: Compute financial subtotals & taxes
    let subtotal = 0;
    const saleItemsData = items.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : product.sellingPrice;
      const itemSubtotal = +(unitPrice * item.quantity).toFixed(2);
      subtotal += itemSubtotal;

      return {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: item.quantity,
        unitPrice,
        subtotal: itemSubtotal,
      };
    });

    subtotal = +subtotal.toFixed(2);

    // Calculate discount
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

    // Validate payment for cash
    const tendered = Number(amountPaid) || totalAmount;
    if (paymentMethod === 'CASH' && tendered < totalAmount - 0.001) {
      return NextResponse.json(
        {
          success: false,
          error: `Amount tendered ($${tendered.toFixed(2)}) is less than total amount ($${totalAmount.toFixed(2)}).`,
        },
        { status: 400 }
      );
    }

    const changeDue = paymentMethod === 'CASH' ? Math.max(0, +(tendered - totalAmount).toFixed(2)) : 0.0;

    // Step 3: Generate sequential unique receipt number
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const todayCount = await prisma.sale.count({
      where: {
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        },
      },
    });
    const seqNum = String(todayCount + 1).padStart(4, '0');
    const receiptNo = `BB-${dateStr}-${seqNum}`;

    // Step 4: Execute atomic database transaction
    const sale = await prisma.$transaction(async (tx) => {
      // 1. Deduct stock for each item
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // 2. Create Sale and SaleItems
      const createdSale = await tx.sale.create({
        data: {
          receiptNo,
          customerId: customerId || null,
          customerName: customerName.trim() || 'Walk-in Customer',
          cashierId: cashierId || null,
          cashierName: cashierName?.trim() || 'Cashier',
          subtotal,
          discountType,
          discountValue: Number(discountValue) || 0,
          discountAmount,
          taxRate: effectiveTaxRate,
          taxAmount,
          totalAmount,
          paymentMethod,
          amountPaid: tendered,
          changeDue,
          notes: notes?.trim() || null,
          items: {
            create: saleItemsData,
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });

      // 3. Increment loyalty points for registered customer (1 point per 10 currency units spent)
      if (customerId) {
        const earnedPoints = Math.floor(totalAmount / 10);
        if (earnedPoints > 0) {
          await tx.customer.update({
            where: { id: customerId },
            data: {
              loyaltyPoints: {
                increment: earnedPoints,
              },
            },
          });
        }
      }

      return createdSale;
    });

    return NextResponse.json(
      {
        success: true,
        sale,
        message: 'Transaction completed successfully!',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process checkout transaction' },
      { status: 500 }
    );
  }
}
