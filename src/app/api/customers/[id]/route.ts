import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        sales: {
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    const totalSpent = +customer.sales.reduce((sum, s) => sum + s.totalAmount, 0).toFixed(2);

    return NextResponse.json({
      success: true,
      customer: {
        ...customer,
        salesCount: customer.sales.length,
        totalSpent,
      },
    });
  } catch (error: any) {
    console.error('Error fetching customer details:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching customer' },
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
    const { name, phone, email, address, loyaltyPoints } = body;

    if (phone) {
      const existing = await prisma.customer.findUnique({
        where: { phone: phone.trim() },
      });
      if (existing && existing.id !== params.id) {
        return NextResponse.json(
          { success: false, error: `Phone number '${phone}' is already registered with another customer.` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.customer.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(loyaltyPoints !== undefined && { loyaltyPoints: parseInt(String(loyaltyPoints), 10) }),
      },
    });

    return NextResponse.json({ success: true, customer: updated });
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update customer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.customer.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
