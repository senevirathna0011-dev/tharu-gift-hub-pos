import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
      include: {
        products: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, supplier });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching supplier' },
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
    const { name, company, phone, email, address, notes } = body;

    const updated = await prisma.supplier.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(company && { company: company.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      supplier: updated,
      message: `Supplier "${updated.company}" updated successfully!`,
    });
  } catch (error: any) {
    console.error('Error updating supplier:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update supplier' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.supplier.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Supplier deleted successfully. Linked products have been unassigned.',
    });
  } catch (error: any) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete supplier' },
      { status: 500 }
    );
  }
}
