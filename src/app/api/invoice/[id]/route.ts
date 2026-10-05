import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rawId = params.id?.trim();
    if (!rawId) {
      return NextResponse.json(
        { success: false, error: 'Invoice identifier is required' },
        { status: 400 }
      );
    }

    // Try finding by id or receiptNo
    const sale = await prisma.sale.findFirst({
      where: {
        OR: [
          { id: rawId },
          { receiptNo: rawId },
          { receiptNo: decodeURIComponent(rawId) },
        ],
      },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!sale) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found. Please verify the receipt link.' },
        { status: 404 }
      );
    }

    const storeSettings = await prisma.storeSettings.findFirst();

    return NextResponse.json({
      success: true,
      sale,
      storeSettings: storeSettings || null,
    });
  } catch (error: any) {
    console.error('Error fetching public invoice:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load invoice' },
      { status: 500 }
    );
  }
}
