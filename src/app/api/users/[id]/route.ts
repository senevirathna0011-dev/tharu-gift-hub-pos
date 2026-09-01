import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, username, password, pin, role, isActive } = body;

    if (username) {
      const existing = await prisma.user.findUnique({
        where: { username: username.trim().toLowerCase() },
      });
      if (existing && existing.id !== params.id) {
        return NextResponse.json(
          { success: false, error: `Username "${username}" is taken by another user` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(username && { username: username.trim().toLowerCase() }),
        ...(password && { password: password.trim() }),
        ...(pin && { pin: pin.trim() }),
        ...(role && { role: role === 'ADMIN' ? 'ADMIN' : 'CASHIER' }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    const { password: _pw, pin: _p, ...safeUser } = updated;

    return NextResponse.json({ success: true, user: safeUser });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if this is the last admin
    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (target?.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, error: 'Cannot delete the only remaining Administrator account' },
          { status: 400 }
        );
      }
    }

    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'User deleted' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
