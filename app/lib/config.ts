// Environment Configuration System
// Centralized configuration management for demo/production switching

export type AppMode = 'demo' | 'production'

export interface DatabaseConfig {
  url: string
  provider: 'sqlite' | 'postgresql' | 'mysql'
}

export interface AuthConfig {
  jwtSecret: string
  nextAuthSecret: string
  nextAuthUrl: string
}

export interface PaymentConfig {
  mode: AppMode
  demo?: {
    successRate: number
    processingDelay: number
    enableFailureSimulation: boolean
  }
  stripe?: {
    publishableKey: string
    secretKey: string
    webhookSecret: string
  }
}

export interface EmailConfig {
  service: 'demo' | 'sendgrid' | 'ses'
  demo?: {
    logEmails: boolean
    simulateDelay: number
  }
  sendgrid?: {
    apiKey: string
    fromEmail: string
    fromName: string
  }
  ses?: {
    region: string
    accessKeyId: string
    secretAccessKey: string
    fromEmail: string
  }
}

export interface CMSConfig {
  enabled: boolean
  provider?: 'contentful' | 'strapi' | 'sanity'
  endpoint?: string
  apiKey?: string
  projectId?: string
  fallbackToLocal: boolean
}

export interface StorageConfig {
  provider: 'local' | 'cloudinary' | 's3'
  local?: {
    uploadDir: string
    publicPath: string
  }
  cloudinary?: {
    cloudName: string
    apiKey: string
    apiSecret: string
  }
  s3?: {
    bucket: string
    region: string
    accessKeyId: string
    secretAccessKey: string
  }
}

export interface MonitoringConfig {
  enabled: boolean
  sentry?: {
    dsn: string
    environment: string
  }
  analytics?: {
    googleAnalyticsId: string
  }
}

export interface AppConfig {
  mode: AppMode
  nodeEnv: 'development' | 'production' | 'test'
  siteUrl: string
  siteName: string
  database: DatabaseConfig
  auth: AuthConfig
  payment: PaymentConfig
  email: EmailConfig
  cms: CMSConfig
  storage: StorageConfig
  monitoring: MonitoringConfig
}

// Configuration validation errors
export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value?: any
  ) {
    super(message)
    this.name = 'ConfigValidationError'
  }
}

// Environment variable parser with validation
class ConfigParser {
  private static getRequiredEnv(key: string): string {
    const value = process.env[key]
    if (!value) {
      throw new ConfigValidationError(
        `Required environment variable ${key} is not set`,
        key
      )
    }
    return value
  }

  private static getOptionalEnv(key: string, defaultValue: string = ''): string {
    return process.env[key] || defaultValue
  }

  private static getBooleanEnv(key: string, defaultValue: boolean = false): boolean {
    const value = process.env[key]
    if (!value) return defaultValue
    return value.toLowerCase() === 'true' || value === '1'
  }

  private static getNumberEnv(key: string, defaultValue: number = 0): number {
    const value = process.env[key]
    if (!value) return defaultValue
    const parsed = parseFloat(value)
    if (isNaN(parsed)) {
      throw new ConfigValidationError(
        `Environment variable ${key} must be a valid number, got: ${value}`,
        key,
        value
      )
    }
    return parsed
  }

  static parseConfig(): AppConfig {
    try {
      // Determine app mode
      const mode = (process.env.PAYMENT_MODE || 'demo') as AppMode
      if (!['demo', 'production'].includes(mode)) {
        throw new ConfigValidationError(
          `PAYMENT_MODE must be 'demo' or 'production', got: ${mode}`,
          'PAYMENT_MODE',
          mode
        )
      }

      // Parse database configuration
      const database: DatabaseConfig = {
        url: this.getRequiredEnv('DATABASE_URL'),
        provider: this.determineDatabaseProvider(process.env.DATABASE_URL || '')
      }

      // Parse authentication configuration
      const auth: AuthConfig = {
        jwtSecret: this.getRequiredEnv('JWT_SECRET'),
        nextAuthSecret: this.getRequiredEnv('NEXTAUTH_SECRET'),
        nextAuthUrl: this.getRequiredEnv('NEXTAUTH_URL')
      }

      // Parse payment configuration
      const payment: PaymentConfig = {
        mode,
        demo: mode === 'demo' ? {
          successRate: this.getNumberEnv('DEMO_SUCCESS_RATE', 0.8),
          processingDelay: this.getNumberEnv('DEMO_PROCESSING_DELAY', 2000),
          enableFailureSimulation: this.getBooleanEnv('DEMO_ENABLE_FAILURES', true)
        } : undefined,
        stripe: {
          publishableKey: mode === 'production' ? this.getRequiredEnv('STRIPE_PUBLISHABLE_KEY') : this.getOptionalEnv('STRIPE_PUBLISHABLE_KEY'),
          secretKey: mode === 'production' ? this.getRequiredEnv('STRIPE_SECRET_KEY') : this.getOptionalEnv('STRIPE_SECRET_KEY'),
          webhookSecret: mode === 'production' ? this.getRequiredEnv('STRIPE_WEBHOOK_SECRET') : this.getOptionalEnv('STRIPE_WEBHOOK_SECRET')
        }
      }

      // Parse email configuration
      const emailService = this.getOptionalEnv('EMAIL_SERVICE', mode === 'demo' ? 'demo' : 'sendgrid')
      const email: EmailConfig = {
        service: emailService as EmailConfig['service'],
        demo: emailService === 'demo' ? {
          logEmails: this.getBooleanEnv('DEMO_LOG_EMAILS', true),
          simulateDelay: this.getNumberEnv('DEMO_EMAIL_DELAY', 1000)
        } : undefined,
        sendgrid: emailService === 'sendgrid' ? {
          apiKey: (mode === 'production' && emailService === 'sendgrid') ? this.getRequiredEnv('SENDGRID_API_KEY') : this.getOptionalEnv('SENDGRID_API_KEY'),
          fromEmail: (mode === 'production' && emailService === 'sendgrid') ? this.getRequiredEnv('SENDGRID_FROM_EMAIL') : this.getOptionalEnv('SENDGRID_FROM_EMAIL'),
          fromName: this.getOptionalEnv('SENDGRID_FROM_NAME', 'Kin Workspace')
        } : undefined
      }

      // Parse CMS configuration
      const cms: CMSConfig = {
        enabled: this.getBooleanEnv('CMS_ENABLED', false),
        provider: this.getOptionalEnv('CMS_PROVIDER') as CMSConfig['provider'],
        endpoint: this.getOptionalEnv('CMS_ENDPOINT'),
        apiKey: this.getOptionalEnv('CMS_API_KEY'),
        projectId: this.getOptionalEnv('CMS_PROJECT_ID'),
        fallbackToLocal: this.getBooleanEnv('CMS_FALLBACK_TO_LOCAL', true)
      }

      // Parse storage configuration
      const storageProvider = this.getOptionalEnv('STORAGE_PROVIDER', mode === 'demo' ? 'local' : 'cloudinary')
      const storage: StorageConfig = {
        provider: storageProvider as StorageConfig['provider'],
        local: storageProvider === 'local' ? {
          uploadDir: this.getOptionalEnv('LOCAL_UPLOAD_DIR', './public/uploads'),
          publicPath: this.getOptionalEnv('LOCAL_PUBLIC_PATH', '/uploads')
        } : undefined,
        cloudinary: storageProvider === 'cloudinary' ? {
          cloudName: (mode === 'production' && storageProvider === 'cloudinary') ? this.getRequiredEnv('CLOUDINARY_CLOUD_NAME') : this.getOptionalEnv('CLOUDINARY_CLOUD_NAME'),
          apiKey: (mode === 'production' && storageProvider === 'cloudinary') ? this.getRequiredEnv('CLOUDINARY_API_KEY') : this.getOptionalEnv('CLOUDINARY_API_KEY'),
          apiSecret: (mode === 'production' && storageProvider === 'cloudinary') ? this.getRequiredEnv('CLOUDINARY_API_SECRET') : this.getOptionalEnv('CLOUDINARY_API_SECRET')
        } : undefined
      }

      // Parse monitoring configuration
      const monitoring: MonitoringConfig = {
        enabled: mode === 'production' && this.getBooleanEnv('MONITORING_ENABLED', true),
        sentry: {
          dsn: this.getOptionalEnv('SENTRY_DSN'),
          environment: mode
        },
        analytics: {
          googleAnalyticsId: this.getOptionalEnv('GOOGLE_ANALYTICS_ID')
        }
      }

      return {
        mode,
        nodeEnv: (process.env.NODE_ENV || 'development') as AppConfig['nodeEnv'],
        siteUrl: this.getOptionalEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000'),
        siteName: this.getOptionalEnv('NEXT_PUBLIC_SITE_NAME', 'Kin Workspace'),
        database,
        auth,
        payment,
        email,
        cms,
        storage,
        monitoring
      }
    } catch (error) {
      if (error instanceof ConfigValidationError) {
        throw error
      }
      throw new ConfigValidationError(
        `Failed to parse configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'general'
      )
    }
  }

  private static determineDatabaseProvider(url: string): DatabaseConfig['provider'] {
    if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
      return 'postgresql'
    }
    if (url.startsWith('mysql://')) {
      return 'mysql'
    }
    if (url.startsWith('file:') || url.includes('.db')) {
      return 'sqlite'
    }
    return 'sqlite' // Default fallback
  }
}

// Configuration validator
class ConfigValidator {
  static validate(config: AppConfig): void {
    this.validateMode(config)
    this.validateDatabase(config.database)
    this.validateAuth(config.auth)
    this.validatePayment(config.payment)
    this.validateEmail(config.email)
    this.validateCMS(config.cms)
    this.validateStorage(config.storage)
    this.validateMonitoring(config.monitoring)
  }

  private static validateMode(config: AppConfig): void {
    if (!['demo', 'production'].includes(config.mode)) {
      throw new ConfigValidationError(
        `Invalid app mode: ${config.mode}. Must be 'demo' or 'production'`,
        'mode',
        config.mode
      )
    }
  }

  private static validateDatabase(database: DatabaseConfig): void {
    if (!database.url) {
      throw new ConfigValidationError('Database URL is required', 'database.url')
    }

    // Validate database URL format
    try {
      new URL(database.url.startsWith('file:') ? `file://${database.url.slice(5)}` : database.url)
    } catch {
      // For file URLs, just check if it's a valid path
      if (!database.url.startsWith('file:')) {
        throw new ConfigValidationError(
          `Invalid database URL format: ${database.url}`,
          'database.url',
          database.url
        )
      }
    }
  }

  private static validateAuth(auth: AuthConfig): void {
    if (!auth.jwtSecret || auth.jwtSecret.length < 32) {
      throw new ConfigValidationError(
        'JWT secret must be at least 32 characters long',
        'auth.jwtSecret'
      )
    }

    if (!auth.nextAuthSecret || auth.nextAuthSecret.length < 32) {
      throw new ConfigValidationError(
        'NextAuth secret must be at least 32 characters long',
        'auth.nextAuthSecret'
      )
    }

    try {
      new URL(auth.nextAuthUrl)
    } catch {
      throw new ConfigValidationError(
        `Invalid NextAuth URL: ${auth.nextAuthUrl}`,
        'auth.nextAuthUrl',
        auth.nextAuthUrl
      )
    }
  }

  private static validatePayment(payment: PaymentConfig): void {
    if (payment.mode === 'demo' && payment.demo) {
      if (payment.demo.successRate < 0 || payment.demo.successRate > 1) {
        throw new ConfigValidationError(
          `Demo success rate must be between 0 and 1, got: ${payment.demo.successRate}`,
          'payment.demo.successRate',
          payment.demo.successRate
        )
      }

      if (payment.demo.processingDelay < 0) {
        throw new ConfigValidationError(
          `Demo processing delay must be non-negative, got: ${payment.demo.processingDelay}`,
          'payment.demo.processingDelay',
          payment.demo.processingDelay
        )
      }
    }

    if (payment.mode === 'production' && payment.stripe) {
      if (payment.stripe.publishableKey && !payment.stripe.publishableKey.startsWith('pk_')) {
        throw new ConfigValidationError(
          'Stripe publishable key must start with "pk_"',
          'payment.stripe.publishableKey'
        )
      }

      if (payment.stripe.secretKey && !payment.stripe.secretKey.startsWith('sk_')) {
        throw new ConfigValidationError(
          'Stripe secret key must start with "sk_"',
          'payment.stripe.secretKey'
        )
      }
    }
  }

  private static validateEmail(email: EmailConfig): void {
    if (email.service === 'sendgrid' && email.sendgrid) {
      if (email.sendgrid.apiKey && !email.sendgrid.apiKey.startsWith('SG.')) {
        throw new ConfigValidationError(
          'SendGrid API key must start with "SG."',
          'email.sendgrid.apiKey'
        )
      }

      if (email.sendgrid.fromEmail && !this.isValidEmail(email.sendgrid.fromEmail)) {
        throw new ConfigValidationError(
          `Invalid SendGrid from email: ${email.sendgrid.fromEmail}`,
          'email.sendgrid.fromEmail',
          email.sendgrid.fromEmail
        )
      }
    }
  }

  private static validateCMS(cms: CMSConfig): void {
    if (cms.enabled) {
      if (!cms.provider) {
        throw new ConfigValidationError(
          'CMS provider is required when CMS is enabled',
          'cms.provider'
        )
      }

      if (!cms.endpoint) {
        throw new ConfigValidationError(
          'CMS endpoint is required when CMS is enabled',
          'cms.endpoint'
        )
      }

      try {
        new URL(cms.endpoint)
      } catch {
        throw new ConfigValidationError(
          `Invalid CMS endpoint URL: ${cms.endpoint}`,
          'cms.endpoint',
          cms.endpoint
        )
      }
    }
  }

  private static validateStorage(storage: StorageConfig): void {
    if (storage.provider === 'cloudinary' && storage.cloudinary) {
      if (!storage.cloudinary.cloudName) {
        throw new ConfigValidationError(
          'Cloudinary cloud name is required',
          'storage.cloudinary.cloudName'
        )
      }
    }

    if (storage.provider === 's3' && storage.s3) {
      if (!storage.s3.bucket) {
        throw new ConfigValidationError(
          'S3 bucket name is required',
          'storage.s3.bucket'
        )
      }
    }
  }

  private static validateMonitoring(monitoring: MonitoringConfig): void {
    if (monitoring.enabled && monitoring.sentry?.dsn) {
      try {
        new URL(monitoring.sentry.dsn)
      } catch {
        throw new ConfigValidationError(
          `Invalid Sentry DSN URL: ${monitoring.sentry.dsn}`,
          'monitoring.sentry.dsn',
          monitoring.sentry.dsn
        )
      }
    }
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}

// Singleton configuration instance
let configInstance: AppConfig | null = null

export function getConfig(): AppConfig {
  if (!configInstance) {
    configInstance = ConfigParser.parseConfig()
    ConfigValidator.validate(configInstance)
  }
  return configInstance
}

export function resetConfig(): void {
  configInstance = null
}

// Helper functions for common configuration checks
export function isDemoMode(): boolean {
  return getConfig().mode === 'demo'
}

export function isProductionMode(): boolean {
  return getConfig().mode === 'production'
}

export function isDevelopment(): boolean {
  return getConfig().nodeEnv === 'development'
}

export function isProduction(): boolean {
  return getConfig().nodeEnv === 'production'
}

// Configuration summary for debugging
export function getConfigSummary(): Record<string, any> {
  const config = getConfig()
  
  return {
    mode: config.mode,
    nodeEnv: config.nodeEnv,
    siteUrl: config.siteUrl,
    siteName: config.siteName,
    database: {
      provider: config.database.provider,
      hasUrl: !!config.database.url
    },
    payment: {
      mode: config.payment.mode,
      hasDemoConfig: !!config.payment.demo,
      hasStripeConfig: !!config.payment.stripe?.publishableKey
    },
    email: {
      service: config.email.service,
      hasConfig: !!(config.email.sendgrid?.apiKey || config.email.demo)
    },
    cms: {
      enabled: config.cms.enabled,
      provider: config.cms.provider,
      hasEndpoint: !!config.cms.endpoint
    },
    storage: {
      provider: config.storage.provider,
      hasConfig: !!(config.storage.local || config.storage.cloudinary?.cloudName || config.storage.s3?.bucket)
    },
    monitoring: {
      enabled: config.monitoring.enabled,
      hasSentry: !!config.monitoring.sentry?.dsn,
      hasAnalytics: !!config.monitoring.analytics?.googleAnalyticsId
    }
  }
}

// Environment-specific configuration presets
export const CONFIG_PRESETS = {
  demo: {
    PAYMENT_MODE: 'demo',
    EMAIL_SERVICE: 'demo',
    STORAGE_PROVIDER: 'local',
    CMS_ENABLED: 'false',
    MONITORING_ENABLED: 'false',
    DEMO_SUCCESS_RATE: '0.8',
    DEMO_PROCESSING_DELAY: '2000',
    DEMO_ENABLE_FAILURES: 'true'
  },
  production: {
    PAYMENT_MODE: 'production',
    EMAIL_SERVICE: 'sendgrid',
    STORAGE_PROVIDER: 'cloudinary',
    CMS_ENABLED: 'true',
    MONITORING_ENABLED: 'true'
  }
} as const

export type ConfigPreset = keyof typeof CONFIG_PRESETS