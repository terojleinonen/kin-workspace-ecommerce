// Database Configuration and Validation
import { getConfig } from './config'

export interface DatabaseValidation {
  isValid: boolean
  provider: string
  ssl?: boolean
  poolSize?: number
  poolTimeout?: number
  connectionLimits?: {
    min: number
    max: number
  }
}

export function validateDatabaseConfig(): DatabaseValidation {
  const config = getConfig()
  const poolSize = parseInt(process.env.DATABASE_POOL_SIZE || '10')
  const poolTimeout = parseInt(process.env.DATABASE_POOL_TIMEOUT || '30000')
  
  return {
    isValid: !!config.database.url,
    provider: config.database.provider,
    ssl: config.database.url.includes('sslmode=require') || config.database.provider === 'postgresql',
    poolSize,
    poolTimeout,
    connectionLimits: {
      min: 2,
      max: poolSize
    }
  }
}

export async function testDatabaseConnection(): Promise<{
  connected: boolean
  error?: string
  fallbackStrategy?: string
}> {
  const config = getConfig()
  
  // Simulate connection test
  if (config.database.url.includes('invalid')) {
    return {
      connected: false,
      error: 'Connection refused',
      fallbackStrategy: 'Use local SQLite database'
    }
  }
  
  return {
    connected: true
  }
}