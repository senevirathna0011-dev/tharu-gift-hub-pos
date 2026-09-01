import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'today'; // today, yesterday, week, month, custom
    const customStart = searchParams.get('startDate');
    const customEnd = searchParams.get('endDate');

    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (filter === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (filter === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      startDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
      endDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
    } else if (filter === 'week') {
      const dayOfWeek = now.getDay();
      const diffToMonday = (dayOfWeek + 6) % 7; // Monday start
      const monday = new Date(now);
      monday.setDate(monday.getDate() - diffToMonday);
      startDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0, 0, 0);
    } else if (filter === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (filter === 'custom' && customStart) {
      startDate = new Date(`${customStart}T00:00:00`);
      if (customEnd) {
        endDate = new Date(`${customEnd}T23:59:59.999`);
      }
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    }

    // 1. Fetch filtered sales with items & product cost prices
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                costPrice: true,
                category: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch today's summary specifically
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const todaySales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: { costPrice: true },
            },
          },
        },
      },
    });

    let todayRevenue = 0;
    let todayCost = 0;
    let todayItemsSold = 0;

    for (const s of todaySales) {
      todayRevenue += s.totalAmount;
      for (const item of s.items) {
        todayItemsSold += item.quantity;
        const unitCost = item.product?.costPrice ?? 0;
        todayCost += unitCost * item.quantity;
      }
    }

    const todayProfit = Math.max(0, +(todayRevenue - todayCost).toFixed(2));

    // 3. Process filtered sales statistics
    let totalRevenue = 0;
    let totalCost = 0;
    let totalUnitsSold = 0;

    const paymentMethods = {
      cashRevenue: 0,
      cashCount: 0,
      cardRevenue: 0,
      cardCount: 0,
      digitalRevenue: 0,
      digitalCount: 0,
    };

    const productSalesMap = new Map<string, { productName: string; productSku: string; totalQuantity: number; totalRevenue: number; totalCost: number; totalProfit: number }>();
    const categorySalesMap = new Map<string, { category: string; totalQuantity: number; totalRevenue: number }>();

    const enrichedSales = sales.map((sale) => {
      let saleCost = 0;
      for (const item of sale.items) {
        const itemCost = (item.product?.costPrice ?? 0) * item.quantity;
        saleCost += itemCost;
        totalUnitsSold += item.quantity;

        // Top products accumulation
        const existingProd = productSalesMap.get(item.productSku) || {
          productName: item.productName,
          productSku: item.productSku,
          totalQuantity: 0,
          totalRevenue: 0,
          totalCost: 0,
          totalProfit: 0,
        };
        existingProd.totalQuantity += item.quantity;
        existingProd.totalRevenue = +(existingProd.totalRevenue + item.subtotal).toFixed(2);
        existingProd.totalCost = +(existingProd.totalCost + itemCost).toFixed(2);
        existingProd.totalProfit = +(existingProd.totalRevenue - existingProd.totalCost).toFixed(2);
        productSalesMap.set(item.productSku, existingProd);

        // Category sales accumulation
        const catName = item.product?.category || 'General';
        const existingCat = categorySalesMap.get(catName) || {
          category: catName,
          totalQuantity: 0,
          totalRevenue: 0,
        };
        existingCat.totalQuantity += item.quantity;
        existingCat.totalRevenue = +(existingCat.totalRevenue + item.subtotal).toFixed(2);
        categorySalesMap.set(catName, existingCat);
      }

      totalRevenue += sale.totalAmount;
      totalCost += saleCost;

      // Payment method breakdown
      if (sale.paymentMethod === 'CASH') {
        paymentMethods.cashRevenue = +(paymentMethods.cashRevenue + sale.totalAmount).toFixed(2);
        paymentMethods.cashCount += 1;
      } else if (sale.paymentMethod === 'CARD') {
        paymentMethods.cardRevenue = +(paymentMethods.cardRevenue + sale.totalAmount).toFixed(2);
        paymentMethods.cardCount += 1;
      } else if (sale.paymentMethod === 'DIGITAL') {
        paymentMethods.digitalRevenue = +(paymentMethods.digitalRevenue + sale.totalAmount).toFixed(2);
        paymentMethods.digitalCount += 1;
      }

      const saleProfit = +(sale.totalAmount - saleCost).toFixed(2);

      return {
        ...sale,
        costAmount: +saleCost.toFixed(2),
        profitAmount: saleProfit,
      };
    });

    totalRevenue = +totalRevenue.toFixed(2);
    totalCost = +totalCost.toFixed(2);
    const totalProfit = +(totalRevenue - totalCost).toFixed(2);
    const profitMarginPercent = totalRevenue > 0 ? +((totalProfit / totalRevenue) * 100).toFixed(1) : 0;
    const totalTransactionsCount = sales.length;
    const averageOrderValue = totalTransactionsCount > 0 ? +(totalRevenue / totalTransactionsCount).toFixed(2) : 0;

    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    const categorySales = Array.from(categorySalesMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return NextResponse.json({
      success: true,
      stats: {
        period: filter,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalRevenue,
        totalCost,
        totalProfit,
        profitMarginPercent,
        totalTransactionsCount,
        totalUnitsSold,
        averageOrderValue,
        paymentMethods,
        topProducts,
        categorySales,
        sales: enrichedSales,
        todaySummary: {
          revenue: +todayRevenue.toFixed(2),
          cost: +todayCost.toFixed(2),
          profit: todayProfit,
          salesCount: todaySales.length,
          itemsSold: todayItemsSold,
        },
      },
    });
  } catch (error: any) {
    console.error('Error generating sales report:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate sales report' },
      { status: 500 }
    );
  }
}
