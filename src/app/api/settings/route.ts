import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let settings = await prisma.setting.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.setting.create({
        data: {
          id: 'default',
          shopName: 'Tharu Gift Hub',
          shopTagline: 'Curated Gifts, Keepsakes & Heartfelt Moments',
          address: '452 Velvet Lane, Suite 100, West District',
          phone: '+1 (555) 839-4438',
          email: 'hello@blissandbloomgifts.com',
          currencySymbol: '$',
          currencyCode: 'USD',
          taxRate: 0.08,
          receiptFooter: 'Thank you for shopping with us! Visit again. ✨',
          receiptNote: 'Items in original condition can be exchanged within 14 days with this receipt.',
        },
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      shopName,
      shopTagline,
      address,
      phone,
      email,
      currencySymbol,
      currencyCode,
      taxRate,
      receiptFooter,
      receiptNote,
    } = body;

    const updated = await prisma.setting.upsert({
      where: { id: 'default' },
      update: {
        ...(shopName && { shopName: shopName.trim() }),
        ...(shopTagline !== undefined && { shopTagline: shopTagline?.trim() || null }),
        ...(address && { address: address.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(currencySymbol && { currencySymbol: currencySymbol.trim() }),
        ...(currencyCode && { currencyCode: currencyCode.trim() }),
        ...(taxRate !== undefined && { taxRate: Number(taxRate) }),
        ...(receiptFooter && { receiptFooter: receiptFooter.trim() }),
        ...(receiptNote !== undefined && { receiptNote: receiptNote?.trim() || null }),
      },
      create: {
        id: 'default',
        shopName: shopName?.trim() || 'Tharu Gift Hub',
        shopTagline: shopTagline?.trim() || null,
        address: address?.trim() || '452 Velvet Lane, West District',
        phone: phone?.trim() || '+1 (555) 839-4438',
        email: email?.trim() || null,
        currencySymbol: currencySymbol?.trim() || '$',
        currencyCode: currencyCode?.trim() || 'USD',
        taxRate: Number(taxRate) || 0.08,
        receiptFooter: receiptFooter?.trim() || 'Thank you for shopping with us!',
        receiptNote: receiptNote?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      settings: updated,
      message: 'Settings updated successfully!',
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
