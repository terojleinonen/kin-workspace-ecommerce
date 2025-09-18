import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getDemoModeConfig } from '@/app/lib/demo-utils'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Only allow in demo mode
    const config = getDemoModeConfig()
    if (!config.isDemoMode) {
      return NextResponse.json(
        { error: 'Demo stats only available in demo mode' },
        { status: 403 }
      )
    }

    // Count demo users (excluding admin)
    const demoUserCount = await prisma.user.count({
      where: {
        email: {
          startsWith: 'demo'
        },
        email: {
          not: 'admin@kinworkspace.com'
        }
      }
    })

    // Count demo orders
    const demoOrderCount = await prisma.order.count({
      where: {
        id: {
          startsWith: 'DEMO-'
        }
      }
    })

    // Count demo reviews
    const demoReviewCount = await prisma.review.count({
      where: {
        userId: {
          startsWith: 'demo-user'
        }
      }
    })

    // Get last reset time (approximate based on newest demo order)
    const newestDemoOrder = await prisma.order.findFirst({
      where: {
        id: {
          startsWith: 'DEMO-'
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      users: demoUserCount,
      orders: demoOrderCount,
      reviews: demoReviewCount,
      lastReset: newestDemoOrder?.createdAt || null
    })
  } catch (error) {
    console.error('Error fetching demo stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch demo stats' },
      { status: 500 }
    )
  }
}