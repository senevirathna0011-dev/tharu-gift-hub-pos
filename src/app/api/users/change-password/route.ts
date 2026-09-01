import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, currentPassword, newPassword, adminReset } = body;

    if (!userId || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'User ID and New Password are required' },
        { status: 400 }
      );
    }

    if (newPassword.trim().length < 4) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 4 characters' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // If not an admin reset, verify current password
    if (!adminReset) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: 'Current password is required' },
          { status: 400 }
        );
      }

      const isCurrentCorrect =
        (user.password && user.password === currentPassword.trim()) ||
        (user.pin && user.pin === currentPassword.trim());

      if (!isCurrentCorrect) {
        return NextResponse.json(
          { success: false, error: 'Incorrect current password' },
          { status: 401 }
        );
      }
    }

    // Update password and pin
    const trimmedNew = newPassword.trim();
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        password: trimmedNew,
        // If the new password is all digits, also sync PIN
        pin: /^\d{4,6}$/.test(trimmedNew) ? trimmedNew : user.pin,
      },
    });

    const { password: _p, pin: _pin, ...safeUser } = updated;

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully!',
      user: safeUser,
    });
  } catch (error: any) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update password' },
      { status: 500 }
    );
  }
}
