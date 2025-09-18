import { NextRequest, NextResponse } from 'next/server'
import { CMSClient } from '../../../lib/cms-client'
import { ProductSyncService } from '../../../lib/product-sync'
import { CMSFallbackService } from '../../../lib/cms-fallback'
import { getCMSConfig } from '../../../lib/cms-config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { category, forceUpdate, dryRun } = body

    // Get CMS configuration
    const config = getCMSConfig()
    const cmsClient = new CMSClient(config)
    const syncService = new ProductSyncService(cmsClient)
    const fallbackService = new CMSFallbackService(cmsClient)

    // Trigger sync with options
    const result = await syncService.triggerSync({
      category,
      forceUpdate,
      dryRun
    })

    // Update sync status
    await fallbackService.updateSyncStatus(result.success, result.errors.join('; ') || undefined)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Sync API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get sync status
    const config = getCMSConfig()
    const cmsClient = new CMSClient(config)
    const fallbackService = new CMSFallbackService(cmsClient)

    const status = await fallbackService.getSyncStatus()
    const history = await fallbackService.getSyncHistory(20)

    return NextResponse.json({
      status,
      history
    })
  } catch (error) {
    console.error('Sync status API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}