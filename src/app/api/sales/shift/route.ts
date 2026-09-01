import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cashierId = searchParams.get('cashierId')?.trim();
    const cashierName = searchParams.get('cashierName')?.trim();

    if (!cashierId && !cashierName) {
      return NextResponse.json(
        { success: false, error: 'Cashier ID or Name is required' },
        { status: 400 }
      );
    }

    // Determine today's local start of day
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // Build filter: strictly restricted to active cashier's sales today
    const whereConditions: any[] = [];

    if (cashierId && cashierName) {
      whereConditions.push({
        OR: [
          { cashierId: cashierId },
          { cashierName: { equals: cashierName } },
        ],
      });
    } else if (cashierId) {
      whereConditions.push({ cashierId });
    } else if (cashierName) {
      whereConditions.push({ cashierName });
    }

    whereConditions.push({
      createdAt: {
        gte: startOfToday,
      },
    });

    const sales = await prisma.sale.findMany({
      where: {
        AND: whereConditions,
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Compute metrics
    let totalSalesAmount = 0;
    let totalItemsSold = 0;
    const paymentBreakdown = {
      cash: { amount: 0, count: 0 },
      card: { amount: 0, count: 0 },
      digital: { amount: 0, count: 0 },
      credit: { amount: 0, count: 0 },
    };

    for (const sale of sales) {
      totalSalesAmount += sale.totalAmount;
      const itemsCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
      totalItemsSold += itemsCount;

      const method = (sale.paymentMethod || 'CASH').toUpperCase();
      if (method === 'CASH') {
        paymentBreakdown.cash.amount = +(paymentBreakdown.cash.amount + sale.totalAmount).toFixed(2);
        paymentBreakdown.cash.count += 1;
      } else if (method === 'CARD') {
        paymentBreakdown.card.amount = +(paymentBreakdown.card.amount + sale.totalAmount).toFixed(2);
        paymentBreakdown.card.count += 1;
      } else if (method === 'CREDIT' || method === 'CREDIT_NOTE') {
        paymentBreakdown.credit.amount = +(paymentBreakdown.credit.amount + sale.totalAmount).toFixed(2);
        paymentBreakdown.credit.count += 1;
      } else {
        paymentBreakdown.digital.amount = +(paymentBreakdown.digital.amount + sale.totalAmount).toFixed(2);
        paymentBreakdown.digital.count += 1;
      }
    }

    totalSalesAmount = +totalSalesAmount.toFixed(2);

    return NextResponse.json({
      success: true,
      stats: {
        cashierId: cashierId || 'unknown',
        cashierName: cashierName || (sales[0]?.cashierName || 'Cashier'),
        date: now.toISOString(),
        totalSalesAmount,
        totalTransactionsCount: sales.length,
        totalItemsSold,
        paymentBreakdown,
        sales,
      },
    });
  } catch (error: any) {
    console.error('Error fetching cashier shift sales:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch cashier shift sales' },
      { status: 500 }
    );
  }
}
