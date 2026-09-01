import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, pin } = body;

    const credential = (password || pin || '').trim();

    if (!username || !credential) {
      return NextResponse.json(
        { success: false, error: 'Username and Password (or PIN) are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        username: username.trim().toLowerCase(),
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'This user account has been deactivated. Please contact an Administrator.' },
        { status: 403 }
      );
    }

    // Check match against password or pin
    const passwordMatch = user.password && user.password === credential;
    const pinMatch = user.pin && user.pin === credential;

    if (!passwordMatch && !pinMatch) {
      return NextResponse.json(
        { success: false, error: 'Incorrect username or password' },
        { status: 401 }
      );
    }

    // Return safe user without secret fields
    const { password: _pw, pin: _pin, ...safeUser } = user;

    return NextResponse.json({
      success: true,
      user: safeUser,
      message: `Welcome back, ${user.name}!`,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
