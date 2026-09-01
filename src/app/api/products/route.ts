import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.trim() || '';
    const category = searchParams.get('category')?.trim() || '';
    const supplierId = searchParams.get('supplierId')?.trim() || '';
    const lowStock = searchParams.get('lowStock') === 'true';

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { category: { contains: search } },
      ];
    }

    if (category && category !== 'All') {
      whereClause.category = category;
    }

    if (supplierId) {
      whereClause.supplierId = supplierId;
    }

    let products = await prisma.product.findMany({
      where: whereClause,
      include: {
        supplier: true,
      },
      orderBy: { name: 'asc' },
    });

    if (lowStock) {
      products = products.filter((p) => p.stockQuantity <= p.minStockAlert);
    }

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      sku,
      category,
      costPrice,
      sellingPrice,
      stockQuantity,
      minStockAlert,
      image,
      imageUrl,
      description,
      isPublic,
      supplierId,
    } = body;

    if (!name || !sku || !category || sellingPrice === undefined) {
      return NextResponse.json(
        { success: false, error: 'Name, SKU/Barcode, Category, and Selling Price are required.' },
        { status: 400 }
      );
    }

    // Check SKU collision
    const existing = await prisma.product.findUnique({
      where: { sku: sku.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Product with Barcode/SKU '${sku}' already exists.` },
        { status: 409 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        sku: sku.trim(),
        category: category.trim(),
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        stockQuantity: parseInt(stockQuantity, 10) || 0,
        minStockAlert: parseInt(minStockAlert, 10) || 5,
        image: (image || imageUrl)?.trim() || null,
        description: description?.trim() || null,
        isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
        supplierId: supplierId?.trim() || null,
      },
      include: {
        supplier: true,
      },
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}
