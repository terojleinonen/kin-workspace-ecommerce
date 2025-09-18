import { NextResponse } from 'next/server'
import { CMSClient } from '../../../lib/cms-client'
import { getCMSConfig } from '../../../lib/cms-config'

export async function GET() {
  try {
    // Get CMS configuration
    const config = getCMSConfig()
    const cmsClient = new CMSClient(config)

    // Test connection
    const connectionResult = await cmsClient.testConnection()
    const healthStatus = await cmsClient.getHealthStatus()

    return NextResponse.json({
      connection: connectionResult,
      health: healthStatus,
      config: {
        provider: config.provider,
        apiUrl: config.apiUrl,
        // Don't expose sensitive information
        hasApiKey: !!config.apiKey,
        timeout: config.timeout,
        retryAttempts: config.retryAttempts
      }
    })
  } catch (error) {
    console.error('Connection test API error:', error)
    return NextResponse.json(
      { 
        connection: { 
          success: false, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        },
        health: { 
          isHealthy: false, 
          responseTime: 0, 
          lastChecked: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    )
  }
}