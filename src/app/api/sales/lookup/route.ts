import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const receiptNo = searchParams.get('receiptNo')?.trim();

    if (!receiptNo) {
      return NextResponse.json(
        { success: false, error: 'Receipt Number is required' },
        { status: 400 }
      );
    }

    // Find sale by receiptNo
    const sale = await prisma.sale.findFirst({
      where: {
        receiptNo: {
          equals: receiptNo,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        returns: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!sale) {
      return NextResponse.json(
        { success: false, error: `No sales receipt found with number "${receiptNo}"` },
        { status: 404 }
      );
    }

    // Calculate previously returned quantities per product SKU/ID
    const returnedQtyMap = new Map<string, number>();
    for (const ret of sale.returns) {
      for (const retItem of ret.items) {
        const key = retItem.productSku || retItem.productId || retItem.productName;
        const prev = returnedQtyMap.get(key) || 0;
        returnedQtyMap.set(key, prev + retItem.quantity);
      }
    }

    const itemsWithReturnStatus = sale.items.map((item) => {
      const key = item.productSku || item.productId || item.productName;
      const alreadyReturned = returnedQtyMap.get(key) || 0;
      const remainingReturnable = Math.max(0, item.quantity - alreadyReturned);

      return {
        ...item,
        alreadyReturned,
        remainingReturnable,
      };
    });

    return NextResponse.json({
      success: true,
      sale: {
        ...sale,
        items: itemsWithReturnStatus,
      },
    });
  } catch (error: any) {
    console.error('Error looking up sale receipt:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to lookup receipt' },
      { status: 500 }
    );
  }
}
