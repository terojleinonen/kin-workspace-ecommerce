import { CMSConfig } from './cms-client'

// Environment-based CMS configuration
export interface CMSEnvironmentConfig {
  development: CMSConfig
  staging?: CMSConfig
  production?: CMSConfig
}

// Default configurations for different CMS providers
export const DEFAULT_CMS_CONFIGS: Record<string, Partial<CMSConfig>> = {
  contentful: {
    provider: 'contentful',
    apiUrl: 'https://cdn.contentful.com',
    timeout: 10000,
    retryAttempts: 3,
    enableCache: true,
    cacheTimeout: 300000 // 5 minutes
  },
  strapi: {
    provider: 'strapi',
    timeout: 8000,
    retryAttempts: 2,
    enableCache: true,
    cacheTimeout: 180000 // 3 minutes
  },
  sanity: {
    provider: 'sanity',
    timeout: 8000,
    retryAttempts: 2,
    enableCache: true,
    cacheTimeout: 240000 // 4 minutes
  },
  demo: {
    provider: 'custom',
    apiUrl: 'http://localhost:3000/api/cms',
    timeout: 5000,
    retryAttempts: 1,
    enableCache: false
  }
}

export class CMSConfigManager {
  private static instance: CMSConfigManager
  private config: CMSConfig | null = null
  private environment: string

  private constructor() {
    this.environment = process.env.NODE_ENV || 'development'
  }

  static getInstance(): CMSConfigManager {
    if (!CMSConfigManager.instance) {
      CMSConfigManager.instance = new CMSConfigManager()
    }
    return CMSConfigManager.instance
  }

  /**
   * Load CMS configuration from environment variables
   */
  loadFromEnvironment(): CMSConfig {
    const provider = (process.env.CMS_PROVIDER || 'demo') as CMSConfig['provider']
    const baseConfig = DEFAULT_CMS_CONFIGS[provider] || DEFAULT_CMS_CONFIGS.demo

    const config: CMSConfig = {
      ...baseConfig,
      provider,
      apiUrl: process.env.CMS_API_URL || baseConfig.apiUrl || '',
      apiKey: process.env.CMS_API_KEY || '',
      spaceId: process.env.CMS_SPACE_ID,
      environment: process.env.CMS_ENVIRONMENT || 'master',
      timeout: parseInt(process.env.CMS_TIMEOUT || '') || baseConfig.timeout || 5000,
      retryAttempts: parseInt(process.env.CMS_RETRY_ATTEMPTS || '') || baseConfig.retryAttempts || 1,
      enableCache: process.env.CMS_ENABLE_CACHE === 'true' || baseConfig.enableCache || false,
      cacheTimeout: parseInt(process.env.CMS_CACHE_TIMEOUT || '') || baseConfig.cacheTimeout || 300000
    }

    this.validateConfig(config)
    this.config = config
    return config
  }

  /**
   * Load CMS configuration from a configuration object
   */
  loadFromConfig(envConfig: CMSEnvironmentConfig): CMSConfig {
    let config: CMSConfig

    switch (this.environment) {
      case 'production':
        config = envConfig.production || envConfig.development
        break
      case 'staging':
        config = envConfig.staging || envConfig.development
        break
      default:
        config = envConfig.development
    }

    this.validateConfig(config)
    this.config = config
    return config
  }

  /**
   * Get the current CMS configuration
   */
  getConfig(): CMSConfig {
    if (!this.config) {
      return this.loadFromEnvironment()
    }
    return this.config
  }

  /**
   * Check if CMS is configured and enabled
   */
  isEnabled(): boolean {
    try {
      const config = this.getConfig()
      return !!(config.apiUrl && config.apiKey)
    } catch {
      return false
    }
  }

  /**
   * Check if we're in demo mode
   */
  isDemoMode(): boolean {
    const config = this.getConfig()
    return config.provider === 'custom' && config.apiUrl?.includes('localhost')
  }

  /**
   * Get demo configuration
   */
  getDemoConfig(): CMSConfig {
    return {
      provider: 'custom',
      apiUrl: 'http://localhost:3000/api/cms',
      apiKey: 'demo-key',
      timeout: 5000,
      retryAttempts: 1,
      enableCache: false
    }
  }

  /**
   * Create configuration for different providers
   */
  createContentfulConfig(spaceId: string, apiKey: string, environment = 'master'): CMSConfig {
    return {
      ...DEFAULT_CMS_CONFIGS.contentful,
      provider: 'contentful',
      apiUrl: 'https://cdn.contentful.com',
      apiKey,
      spaceId,
      environment,
      timeout: 10000,
      retryAttempts: 3
    }
  }

  createStrapiConfig(apiUrl: string, apiKey: string): CMSConfig {
    return {
      ...DEFAULT_CMS_CONFIGS.strapi,
      provider: 'strapi',
      apiUrl,
      apiKey,
      timeout: 8000,
      retryAttempts: 2
    }
  }

  createSanityConfig(projectId: string, dataset: string, apiKey: string): CMSConfig {
    return {
      ...DEFAULT_CMS_CONFIGS.sanity,
      provider: 'sanity',
      apiUrl: `https://${projectId}.api.sanity.io/v2021-10-21/data/query/${dataset}`,
      apiKey,
      timeout: 8000,
      retryAttempts: 2
    }
  }

  /**
   * Validate CMS configuration
   */
  private validateConfig(config: CMSConfig): void {
    if (!config.provider) {
      throw new Error('CMS provider is required')
    }

    if (!config.apiUrl) {
      throw new Error('CMS API URL is required')
    }

    if (!config.apiKey && config.provider !== 'custom') {
      throw new Error('CMS API key is required')
    }

    if (config.provider === 'contentful' && !config.spaceId) {
      throw new Error('Contentful space ID is required')
    }

    if (config.timeout <= 0) {
      throw new Error('CMS timeout must be positive')
    }

    if (config.retryAttempts < 0) {
      throw new Error('CMS retry attempts must be non-negative')
    }
  }

  /**
   * Reset configuration (useful for testing)
   */
  reset(): void {
    this.config = null
  }
}

// Export singleton instance
export const cmsConfigManager = CMSConfigManager.getInstance()

// Helper functions for common use cases
export function getCMSConfig(): CMSConfig {
  return cmsConfigManager.getConfig()
}

export function isCMSEnabled(): boolean {
  return cmsConfigManager.isEnabled()
}

export function isDemoMode(): boolean {
  return cmsConfigManager.isDemoMode()
}