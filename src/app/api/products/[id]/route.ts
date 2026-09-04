import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      images,
      description,
      isPublic,
      supplierId,
    } = body;

    // Normalize images array (max 5) if provided
    let finalImages: string[] | undefined = undefined;
    let finalImage: string | null | undefined = undefined;

    if (images !== undefined) {
      if (Array.isArray(images)) {
        finalImages = images
          .map((img: any) => (typeof img === 'string' ? img.trim() : ''))
          .filter((img: string) => img.length > 0)
          .slice(0, 5);
        finalImage = finalImages.length > 0 ? finalImages[0] : null;
      } else {
        finalImages = [];
        finalImage = null;
      }
    } else if (image !== undefined || imageUrl !== undefined) {
      const single = (image !== undefined ? image : imageUrl)?.trim() || null;
      finalImage = single;
      finalImages = single ? [single] : [];
    }

    // Check if SKU is used by another product
    if (sku) {
      const existing = await prisma.product.findUnique({
        where: { sku: sku.trim() },
      });
      if (existing && existing.id !== params.id) {
        return NextResponse.json(
          { success: false, error: `SKU '${sku}' is already assigned to another product.` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(sku && { sku: sku.trim() }),
        ...(category && { category: category.trim() }),
        ...(costPrice !== undefined && { costPrice: Number(costPrice) }),
        ...(sellingPrice !== undefined && { sellingPrice: Number(sellingPrice) }),
        ...(stockQuantity !== undefined && { stockQuantity: parseInt(stockQuantity, 10) }),
        ...(minStockAlert !== undefined && { minStockAlert: parseInt(minStockAlert, 10) }),
        ...(finalImage !== undefined && { image: finalImage }),
        ...(finalImages !== undefined && { images: finalImages }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isPublic !== undefined && { isPublic: Boolean(isPublic) }),
        ...(supplierId !== undefined && { supplierId: supplierId?.trim() || null }),
      },
      include: {
        supplier: true,
      },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { stockDelta, stockQuantity } = body;

    let updated;
    if (stockQuantity !== undefined) {
      updated = await prisma.product.update({
        where: { id: params.id },
        data: {
          stockQuantity: Math.max(0, parseInt(stockQuantity, 10)),
        },
        include: {
          supplier: true,
        },
      });
    } else if (stockDelta !== undefined) {
      const current = await prisma.product.findUnique({
        where: { id: params.id },
      });
      if (!current) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
      }

      const newQty = Math.max(0, current.stockQuantity + parseInt(stockDelta, 10));
      updated = await prisma.product.update({
        where: { id: params.id },
        data: { stockQuantity: newQty },
        include: {
          supplier: true,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Provide stockQuantity or stockDelta' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error('Error patching product stock:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to adjust stock' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}
