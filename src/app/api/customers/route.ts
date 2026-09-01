import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.trim() || '';

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        sales: {
          select: {
            id: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const enrichedCustomers = customers.map((c) => {
      const salesCount = c.sales.length;
      const totalSpent = +c.sales.reduce((sum, s) => sum + s.totalAmount, 0).toFixed(2);
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        loyaltyPoints: c.loyaltyPoints,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        salesCount,
        totalSpent,
      };
    });

    return NextResponse.json({ success: true, customers: enrichedCustomers });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, address, loyaltyPoints } = body;

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Customer Name and Phone Number are required.' },
        { status: 400 }
      );
    }

    // Check duplicate phone
    const existing = await prisma.customer.findUnique({
      where: { phone: phone.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Customer with phone number '${phone}' is already registered.` },
        { status: 409 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        address: address?.trim() || null,
        loyaltyPoints: parseInt(String(loyaltyPoints), 10) || 0,
      },
    });

    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch (error: any) {
    console.error('Error registering customer:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to register customer' },
      { status: 500 }
    );
  }
}
