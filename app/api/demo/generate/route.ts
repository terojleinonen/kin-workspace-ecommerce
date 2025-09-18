import { NextRequest, NextResponse } from 'next/server'
import { getDemoModeConfig } from '@/app/lib/demo-utils'
import { seedDemoData, DemoDataOptions } from '@/app/lib/demo-data-generator'

export async function POST(request: NextRequest) {
  try {
    // Only allow in demo mode
    const config = getDemoModeConfig()
    if (!config.isDemoMode) {
      return NextResponse.json(
        { error: 'Demo data generation only available in demo mode' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const options: DemoDataOptions = {
      userCount: body.userCount || 3,
      orderCount: body.orderCount || 5,
      reviewCount: body.reviewCount || 8,
      includeAdmin: body.includeAdmin !== false
    }

    const result = await seedDemoData(options)

    return NextResponse.json({
      success: true,
      message: 'Demo data generated successfully',
      data: result.data
    })
  } catch (error) {
    console.error('Error generating demo data:', error)
    return NextResponse.json(
      { error: 'Failed to generate demo data' },
      { status: 500 }
    )
  }
}