import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.trim() || '';
    const category = searchParams.get('category')?.trim() || '';

    // Only query products marked as public
    const whereClause: any = {
      isPublic: true,
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { category: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (category && category !== 'All') {
      whereClause.category = category;
    }

    // Fetch products
    const rawProducts = await prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        sellingPrice: true,
        image: true,
        images: true,
        description: true,
        stockQuantity: true,
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    // Public sanitized model - NO exact stock numbers, NO cost prices
    const products = rawProducts.map((p) => {
      const productImages = (p.images && p.images.length > 0)
        ? p.images
        : (p.image ? [p.image] : []);
      const primaryImage = productImages[0] || p.image || null;

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        sellingPrice: p.sellingPrice,
        image: primaryImage,
        images: productImages,
        description: p.description || null,
        inStock: p.stockQuantity > 0,
      };
    });

    // Extract all available public categories
    const allPublicProducts = await prisma.product.findMany({
      where: { isPublic: true },
      select: { category: true },
    });
    const categories = Array.from(new Set(allPublicProducts.map((p) => p.category))).sort();

    // Fetch store branding info
    const setting = await prisma.setting.findFirst();
    const storeInfo = {
      shopName: setting?.shopName || 'Tharu Gift Hub',
      shopTagline: setting?.shopTagline || 'Curated Gifts, Keepsakes & Heartfelt Moments',
      address: setting?.address || '',
      phone: setting?.phone || '',
      email: setting?.email || '',
      currencySymbol: setting?.currencySymbol || 'Rs.',
    };

    return NextResponse.json({
      success: true,
      store: storeInfo,
      categories,
      products,
      totalCount: products.length,
    });
  } catch (error: any) {
    console.error('Error fetching public catalog:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to load catalog at this time.' },
      { status: 500 }
    );
  }
}
