import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, username, password, pin, role = 'CASHIER', isActive = true } = body;

    const userPassword = (password || pin || '').trim();
    const userPin = (pin || (password && /^\d{4,6}$/.test(password) ? password : '1234')).trim();

    if (!name?.trim() || !username?.trim() || !userPassword) {
      return NextResponse.json(
        { success: false, error: 'Full Name, Username, and Password are required' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { username: username.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Username "${username}" is already taken` },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        password: userPassword,
        pin: userPin,
        role: role === 'ADMIN' ? 'ADMIN' : 'CASHIER',
        isActive: Boolean(isActive),
      },
    });

    const { password: _p, pin: _pin, ...safeUser } = user;

    return NextResponse.json({ success: true, user: safeUser }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
