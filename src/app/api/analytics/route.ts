import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Get today's sales
    const todaySales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startOfToday,
        },
      },
      include: {
        items: true,
      },
    });

    const todayRevenue = +todaySales.reduce((sum, s) => sum + s.totalAmount, 0).toFixed(2);
    const todaySalesCount = todaySales.length;
    const todayItemsSold = todaySales.reduce(
      (sum, s) => sum + s.items.reduce((iSum, item) => iSum + item.quantity, 0),
      0
    );

    // 2. Inventory stats
    const products = await prisma.product.findMany();
    const totalProductsCount = products.length;
    const lowStockCount = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.minStockAlert).length;
    const outOfStockCount = products.filter((p) => p.stockQuantity === 0).length;
    const totalInventoryValue = +products.reduce((sum, p) => sum + p.costPrice * p.stockQuantity, 0).toFixed(2);

    // 3. Top selling products
    const saleItems = await prisma.saleItem.findMany();
    const productSalesMap = new Map<string, { productName: string; productSku: string; totalQuantity: number; totalRevenue: number }>();

    for (const item of saleItems) {
      const existing = productSalesMap.get(item.productSku) || {
        productName: item.productName,
        productSku: item.productSku,
        totalQuantity: 0,
        totalRevenue: 0,
      };

      existing.totalQuantity += item.quantity;
      existing.totalRevenue = +(existing.totalRevenue + item.subtotal).toFixed(2);
      productSalesMap.set(item.productSku, existing);
    }

    const topSellingProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);

    // 4. Recent sales
    const recentSales = await prisma.sale.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });

    // 5. Catalog analytics / views
    const catalogAnalytics = await prisma.catalogAnalytics.findUnique({
      where: { id: 'default' },
    });
    const totalCatalogViews = catalogAnalytics?.totalViews || 0;
    const lastCatalogView = catalogAnalytics?.lastViewedAt || null;

    return NextResponse.json({
      success: true,
      stats: {
        todayRevenue,
        todaySalesCount,
        todayItemsSold,
        totalInventoryValue,
        totalProductsCount,
        lowStockCount,
        outOfStockCount,
        totalCatalogViews,
        lastCatalogView,
        topSellingProducts,
        recentSales,
      },
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
