import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.trim() || '';
    const paymentMethod = searchParams.get('paymentMethod')?.trim() || '';

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { receiptNo: { contains: search } },
        { customerName: { contains: search } },
      ];
    }

    if (paymentMethod && paymentMethod !== 'All') {
      whereClause.paymentMethod = paymentMethod;
    }

    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    return NextResponse.json({ success: true, sales });
  } catch (error: any) {
    console.error('Error fetching sales history:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch sales history' },
      { status: 500 }
    );
  }
}
