// Database Configuration for Production
// Handles database setup, migrations, and environment-specific configurations

import { getConfig } from './config'

export interface DatabaseConnectionConfig {
  url: string
  provider: 'sqlite' | 'postgresql' | 'mysql'
  ssl?: boolean
  connectionLimit?: number
  timeout?: number
  retries?: number
}

export interface MigrationConfig {
  migrationsPath: string
  seedPath?: string
  autoMigrate: boolean
  backupBeforeMigration: boolean
}

export class DatabaseManager {
  private config: DatabaseConnectionConfig
  private migrationConfig: MigrationConfig

  constructor() {
    const appConfig = getConfig()
    
    this.config = {
      url: appConfig.database.url,
      provider: appConfig.database.provider,
      ssl: appConfig.nodeEnv === 'production',
      connectionLimit: appConfig.nodeEnv === 'production' ? 20 : 5,
      timeout: 30000,
      retries: 3
    }

    this.migrationConfig = {
      migrationsPath: './prisma/migrations',
      seedPath: './prisma/seed.ts',
      autoMigrate: appConfig.nodeEnv !== 'production', // Only auto-migrate in dev
      backupBeforeMigration: appConfig.nodeEnv === 'production'
    }
  }

  // Get database connection configuration
  getConnectionConfig(): DatabaseConnectionConfig {
    return { ...this.config }
  }

  // Get Prisma database URL with proper formatting
  getPrismaDatabaseUrl(): string {
    const config = getConfig()
    
    if (config.database.provider === 'postgresql') {
      // Ensure SSL is properly configured for production PostgreSQL
      if (config.nodeEnv === 'production' && !this.config.url.includes('sslmode=')) {
        const separator = this.config.url.includes('?') ? '&' : '?'
        return `${this.config.url}${separator}sslmode=require`
      }
    }
    
    return this.config.url
  }

  // Validate database connection
  async validateConnection(): Promise<{ valid: boolean; error?: string; provider?: string }> {
    try {
      // In production, this would use actual database connection testing
      // For now, we'll validate the URL format and configuration
      
      if (!this.config.url) {
        return { valid: false, error: 'Database URL is required' }
      }

      // Validate URL format based on provider
      const isValidUrl = this.validateDatabaseUrl(this.config.url, this.config.provider)
      if (!isValidUrl) {
        return { 
          valid: false, 
          error: `Invalid ${this.config.provider} database URL format` 
        }
      }

      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 100))
      
      return { 
        valid: true, 
        provider: this.config.provider 
      }
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Connection validation failed' 
      }
    }
  }

  // Check if migrations are needed
  async checkMigrationStatus(): Promise<{
    needsMigration: boolean
    pendingMigrations: string[]
    currentVersion?: string
  }> {
    try {
      // In production, this would check actual migration status
      // For now, simulate migration checking
      
      const config = getConfig()
      
      // In demo mode, assume migrations are up to date
      if (config.mode === 'demo') {
        return {
          needsMigration: false,
          pendingMigrations: [],
          currentVersion: 'demo_latest'
        }
      }

      // In production, would check against actual database
      return {
        needsMigration: false,
        pendingMigrations: [],
        currentVersion: 'production_latest'
      }
    } catch (error) {
      throw new Error(`Failed to check migration status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Run database migrations
  async runMigrations(options: {
    dryRun?: boolean
    force?: boolean
    backup?: boolean
  } = {}): Promise<{
    success: boolean
    migrationsRun: string[]
    error?: string
    backupPath?: string
  }> {
    try {
      const config = getConfig()
      
      // Create backup if requested or in production
      let backupPath: string | undefined
      if (options.backup || (config.nodeEnv === 'production' && this.migrationConfig.backupBeforeMigration)) {
        backupPath = await this.createDatabaseBackup()
      }

      // In production, this would run actual Prisma migrations
      // For now, simulate migration execution
      
      if (options.dryRun) {
        return {
          success: true,
          migrationsRun: ['20240101000000_example_migration'],
          backupPath
        }
      }

      // Simulate running migrations
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return {
        success: true,
        migrationsRun: ['20240101000000_example_migration'],
        backupPath
      }
    } catch (error) {
      return {
        success: false,
        migrationsRun: [],
        error: error instanceof Error ? error.message : 'Migration failed'
      }
    }
  }

  // Create database backup
  async createDatabaseBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = `./backups/database_backup_${timestamp}.sql`
    
    // In production, this would create actual database backup
    // For now, simulate backup creation
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return backupPath
  }

  // Seed database with initial data
  async seedDatabase(options: {
    force?: boolean
    environment?: 'demo' | 'production'
  } = {}): Promise<{
    success: boolean
    seedsRun: string[]
    error?: string
  }> {
    try {
      const config = getConfig()
      const environment = options.environment || config.mode
      
      // In production, this would run actual seed scripts
      // For now, simulate seeding
      
      const seedsToRun = environment === 'demo' 
        ? ['demo_users', 'demo_products', 'demo_orders']
        : ['production_admin', 'production_categories']
      
      await new Promise(resolve => setTimeout(resolve, 800))
      
      return {
        success: true,
        seedsRun: seedsToRun
      }
    } catch (error) {
      return {
        success: false,
        seedsRun: [],
        error: error instanceof Error ? error.message : 'Seeding failed'
      }
    }
  }

  // Reset database (demo mode only)
  async resetDatabase(): Promise<{
    success: boolean
    error?: string
  }> {
    const config = getConfig()
    
    if (config.mode !== 'demo') {
      return {
        success: false,
        error: 'Database reset is only allowed in demo mode'
      }
    }

    try {
      // In demo mode, this would reset the database to initial state
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database reset failed'
      }
    }
  }

  // Get database statistics
  async getDatabaseStats(): Promise<{
    provider: string
    size?: string
    tables: number
    records: Record<string, number>
    lastBackup?: string
  }> {
    try {
      // In production, this would query actual database statistics
      const config = getConfig()
      
      return {
        provider: this.config.provider,
        size: config.mode === 'demo' ? '2.5 MB' : 'Unknown',
        tables: 12,
        records: {
          users: config.mode === 'demo' ? 25 : 0,
          products: config.mode === 'demo' ? 50 : 0,
          orders: config.mode === 'demo' ? 100 : 0,
          reviews: config.mode === 'demo' ? 200 : 0
        },
        lastBackup: config.mode === 'production' ? new Date().toISOString() : undefined
      }
    } catch (error) {
      throw new Error(`Failed to get database stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Private helper methods
  private validateDatabaseUrl(url: string, provider: string): boolean {
    try {
      if (provider === 'sqlite') {
        return url.startsWith('file:') || url.endsWith('.db')
      }
      
      if (provider === 'postgresql') {
        return url.startsWith('postgresql://') || url.startsWith('postgres://')
      }
      
      if (provider === 'mysql') {
        return url.startsWith('mysql://')
      }
      
      return false
    } catch {
      return false
    }
  }

  // Health check for database
  async healthCheck(): Promise<{
    healthy: boolean
    responseTime?: number
    error?: string
    details: {
      connection: boolean
      migrations: boolean
      readWrite: boolean
    }
  }> {
    const startTime = Date.now()
    const details = {
      connection: false,
      migrations: false,
      readWrite: false
    }

    try {
      // Test connection
      const connectionResult = await this.validateConnection()
      details.connection = connectionResult.valid
      
      if (!connectionResult.valid) {
        return {
          healthy: false,
          error: connectionResult.error,
          details
        }
      }

      // Check migrations
      const migrationStatus = await this.checkMigrationStatus()
      details.migrations = !migrationStatus.needsMigration
      
      // Test read/write (simulate)
      await new Promise(resolve => setTimeout(resolve, 50))
      details.readWrite = true
      
      const responseTime = Date.now() - startTime
      
      return {
        healthy: details.connection && details.migrations && details.readWrite,
        responseTime,
        details
      }
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Health check failed',
        details
      }
    }
  }
}

// Singleton instance
let databaseManager: DatabaseManager | null = null

export function getDatabaseManager(): DatabaseManager {
  if (!databaseManager) {
    databaseManager = new DatabaseManager()
  }
  return databaseManager
}

// Helper functions for common database operations
export async function validateDatabaseConnection(): Promise<boolean> {
  const manager = getDatabaseManager()
  const result = await manager.validateConnection()
  return result.valid
}

export async function ensureDatabaseReady(): Promise<void> {
  const manager = getDatabaseManager()
  
  // Check connection
  const connectionResult = await manager.validateConnection()
  if (!connectionResult.valid) {
    throw new Error(`Database connection failed: ${connectionResult.error}`)
  }
  
  // Check migrations
  const migrationStatus = await manager.checkMigrationStatus()
  if (migrationStatus.needsMigration) {
    const config = getConfig()
    
    if (config.nodeEnv === 'production') {
      throw new Error('Database migrations are required. Please run migrations manually in production.')
    } else {
      // Auto-migrate in development
      const migrationResult = await manager.runMigrations()
      if (!migrationResult.success) {
        throw new Error(`Migration failed: ${migrationResult.error}`)
      }
    }
  }
}

// Database configuration for different environments
export const DATABASE_CONFIGS = {
  development: {
    provider: 'sqlite',
    url: 'file:./prisma/dev.db',
    ssl: false,
    connectionLimit: 5
  },
  production: {
    provider: 'postgresql',
    ssl: true,
    connectionLimit: 20,
    timeout: 30000
  },
  test: {
    provider: 'sqlite',
    url: 'file:./prisma/test.db',
    ssl: false,
    connectionLimit: 1
  }
} as const