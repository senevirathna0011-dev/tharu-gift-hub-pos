import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.trim() || '';

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { returnNo: { contains: search } },
        { receiptNo: { contains: search } },
        { customerName: { contains: search } },
        { cashierName: { contains: search } },
      ];
    }

    const returns = await prisma.salesReturn.findMany({
      where: whereClause,
      include: {
        items: true,
        sale: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    return NextResponse.json({ success: true, returns });
  } catch (error: any) {
    console.error('Error fetching returns:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch returns history' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      saleId,
      receiptNo,
      cashierId = null,
      cashierName = 'Cashier',
      customerName = 'Walk-in Customer',
      refundMethod = 'CASH',
      reason = 'Customer Return',
      notes = '',
      items,
    } = body;

    if (!saleId || !receiptNo) {
      return NextResponse.json(
        { success: false, error: 'Original Sale ID and Receipt Number are required' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Select at least one item to return' },
        { status: 400 }
      );
    }

    // Validate that items have valid quantities > 0
    const validItems = items.filter((item: any) => Number(item.quantity) > 0);
    if (validItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Return quantities must be greater than zero' },
        { status: 400 }
      );
    }

    // Generate unique sequential return number
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const todayReturnCount = await prisma.salesReturn.count({
      where: {
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        },
      },
    });
    const seqNum = String(todayReturnCount + 1).padStart(4, '0');
    const returnNo = `RET-${dateStr}-${seqNum}`;

    // Compute line subtotals and total refund
    let totalRefundAmount = 0;
    const returnItemsData = validItems.map((item: any) => {
      const qty = parseInt(String(item.quantity), 10);
      const unitPrice = Number(item.unitPrice) || 0;
      const subtotal = +(qty * unitPrice).toFixed(2);
      totalRefundAmount += subtotal;

      return {
        productId: item.productId || null,
        productName: item.productName || 'Product',
        productSku: item.productSku || 'SKU',
        quantity: qty,
        unitPrice,
        subtotal,
        reason: item.reason || reason,
      };
    });

    totalRefundAmount = +totalRefundAmount.toFixed(2);

    // Execute atomic transaction: Restock inventory + Create Return records
    const salesReturn = await prisma.$transaction(async (tx) => {
      // 1. Restock returned items back into Product stockQuantity
      for (const item of returnItemsData) {
        if (item.productId) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (product) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: {
                  increment: item.quantity,
                },
              },
            });
          }
        }
      }

      // 2. Create the SalesReturn record with items
      const createdReturn = await tx.salesReturn.create({
        data: {
          returnNo,
          saleId,
          receiptNo,
          customerId: body.customerId || null,
          customerName: customerName.trim() || 'Walk-in Customer',
          cashierId: cashierId || null,
          cashierName: cashierName.trim() || 'Cashier',
          refundAmount: totalRefundAmount,
          refundMethod,
          reason,
          notes: notes?.trim() || null,
          items: {
            create: returnItemsData,
          },
        },
        include: {
          items: true,
          sale: true,
        },
      });

      return createdReturn;
    });

    return NextResponse.json(
      {
        success: true,
        salesReturn,
        message: `Return ${returnNo} processed successfully! ${returnItemsData.reduce((s, i) => s + i.quantity, 0)} item(s) restocked.`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error processing sales return:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process sales return' },
      { status: 500 }
    );
  }
}
