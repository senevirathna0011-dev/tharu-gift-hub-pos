import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let settings = await prisma.storeSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {
          id: 'default',
          shopName: 'Tharu Gift Hub',
          shopTagline: 'Curated Gifts, Keepsakes & Heartfelt Moments',
          shopLogo: null,
          address: '452 Velvet Lane, Suite 100, West District',
          phone: '+1 (555) 839-4438',
          email: 'hello@blissandbloomgifts.com',
          currencySymbol: '$',
          currencyCode: 'USD',
          taxRate: 0.08,
          headerNote: 'Welcome to Tharu Gift Hub',
          footerNote: 'Thank you for shopping with us! Visit again. ✨',
          receiptFooter: 'Thank you for shopping with us! Visit again. ✨',
          receiptNote: 'Items in original condition can be exchanged within 14 days with receipt.',
          showLogoOnReceipt: true,
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
      shopLogo,
      address,
      phone,
      email,
      currencySymbol,
      currencyCode,
      taxRate,
      headerNote,
      footerNote,
      receiptFooter,
      receiptNote,
      showLogoOnReceipt,
    } = body;

    const effectiveFooterNote = footerNote !== undefined ? footerNote : receiptFooter;

    const updated = await prisma.storeSettings.upsert({
      where: { id: 'default' },
      update: {
        ...(shopName !== undefined && { shopName: shopName.trim() }),
        ...(shopTagline !== undefined && { shopTagline: shopTagline?.trim() || null }),
        ...(shopLogo !== undefined && { shopLogo: shopLogo || null }),
        ...(address !== undefined && { address: address.trim() }),
        ...(phone !== undefined && { phone: phone.trim() }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(currencySymbol !== undefined && { currencySymbol: currencySymbol.trim() }),
        ...(currencyCode !== undefined && { currencyCode: currencyCode.trim() }),
        ...(taxRate !== undefined && { taxRate: Number(taxRate) }),
        ...(headerNote !== undefined && { headerNote: headerNote?.trim() || null }),
        ...(effectiveFooterNote !== undefined && { 
          footerNote: effectiveFooterNote?.trim() || null,
          receiptFooter: effectiveFooterNote?.trim() || 'Thank you for shopping with us!',
        }),
        ...(receiptNote !== undefined && { receiptNote: receiptNote?.trim() || null }),
        ...(showLogoOnReceipt !== undefined && { showLogoOnReceipt: Boolean(showLogoOnReceipt) }),
      },
      create: {
        id: 'default',
        shopName: shopName?.trim() || 'Tharu Gift Hub',
        shopTagline: shopTagline?.trim() || null,
        shopLogo: shopLogo || null,
        address: address?.trim() || '452 Velvet Lane, West District',
        phone: phone?.trim() || '+1 (555) 839-4438',
        email: email?.trim() || null,
        currencySymbol: currencySymbol?.trim() || '$',
        currencyCode: currencyCode?.trim() || 'USD',
        taxRate: Number(taxRate) || 0.08,
        headerNote: headerNote?.trim() || null,
        footerNote: effectiveFooterNote?.trim() || 'Thank you for shopping with us! Visit again. ✨',
        receiptFooter: effectiveFooterNote?.trim() || 'Thank you for shopping with us! Visit again. ✨',
        receiptNote: receiptNote?.trim() || null,
        showLogoOnReceipt: showLogoOnReceipt !== undefined ? Boolean(showLogoOnReceipt) : true,
      },
    });

    return NextResponse.json({
      success: true,
      settings: updated,
      message: 'Store and invoice settings updated successfully!',
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
