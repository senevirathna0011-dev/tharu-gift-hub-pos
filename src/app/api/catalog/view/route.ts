import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const analytics = await prisma.catalogAnalytics.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        totalViews: 1,
        lastViewedAt: new Date(),
      },
      update: {
        totalViews: {
          increment: 1,
        },
        lastViewedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      totalViews: analytics.totalViews,
      lastViewedAt: analytics.lastViewedAt,
    });
  } catch (error: any) {
    console.error('Error incrementing catalog view count:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record catalog view' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const analytics = await prisma.catalogAnalytics.findUnique({
      where: { id: 'default' },
    });

    return NextResponse.json({
      success: true,
      totalViews: analytics?.totalViews || 0,
      lastViewedAt: analytics?.lastViewedAt || null,
    });
  } catch (error: any) {
    console.error('Error fetching catalog view count:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch catalog views' },
      { status: 500 }
    );
  }
}
