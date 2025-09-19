/**
 * Focused Production Readiness Tests
 * 
 * Tests environment variable switching and service integrations
 * without requiring full environment setup.
 */

// Mock environment variables
const originalEnv = process.env

beforeEach(() => {
  jest.resetModules()
  process.env = { 
    ...originalEnv,
    // Set minimal required environment variables
    DATABASE_URL: 'file:./test.db',
    JWT_SECRET: 'test-jwt-secret-that-is-long-enough-for-validation',
    NEXTAUTH_SECRET: 'test-nextauth-secret-that-is-long-enough-for-validation',
    NEXTAUTH_URL: 'http://localhost:3000'
  }
})

afterAll(() => {
  process.env = originalEnv
})

describe('Production Readiness Tests', () => {
  describe('Environment Variable Switching', () => {
    test('should validate required production environment variables', () => {
      // Test missing variables
      delete process.env.DATABASE_URL
      delete process.env.JWT_SECRET
      delete process.env.NEXTAUTH_SECRET
      delete process.env.STRIPE_SECRET_KEY
      delete process.env.STRIPE_PUBLIC_KEY

      const { validateProductionConfig } = require('../app/lib/config')
      const validation = validateProductionConfig()

      expect(validation.isValid).toBe(false)
      expect(validation.missingVars).toEqual(expect.arrayContaining([
        'DATABASE_URL',
        'JWT_SECRET', 
        'NEXTAUTH_SECRET',
        'STRIPE_SECRET_KEY',
        'STRIPE_PUBLIC_KEY'
      ]))
    })

    test('should validate optional production environment variables', () => {
      // Set required vars
      process.env.DATABASE_URL = 'postgresql://test'
      process.env.JWT_SECRET = 'test-secret-that-is-long-enough'
      process.env.NEXTAUTH_SECRET = 'nextauth-secret-that-is-long-enough'
      process.env.STRIPE_SECRET_KEY = 'sk_test_123'
      process.env.STRIPE_PUBLIC_KEY = 'pk_test_123'

      const { validateProductionConfig } = require('../app/lib/config')
      const validation = validateProductionConfig()

      expect(validation.isValid).toBe(true)
      expect(validation.warnings).toEqual(expect.arrayContaining([
        expect.stringContaining('CMS_ENDPOINT'),
        expect.stringContaining('CMS_API_KEY'),
        expect.stringContaining('SENDGRID_API_KEY'),
        expect.stringContaining('CLOUDINARY_CLOUD_NAME'),
        expect.stringContaining('SENTRY_DSN')
      ]))
    })

    test('should switch between demo and production modes', () => {
      // Test demo mode
      process.env.PAYMENT_MODE = 'demo'
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true'
      
      jest.resetModules()
      const { isDemoMode, isProductionMode } = require('../app/lib/config')
      
      expect(isDemoMode()).toBe(true)
      expect(isProductionMode()).toBe(false)
      
      // Test production mode
      process.env.PAYMENT_MODE = 'production'
      process.env.NEXT_PUBLIC_DEMO_MODE = 'false'
      process.env.EMAIL_SERVICE = 'sendgrid'
      process.env.STORAGE_PROVIDER = 'cloudinary'
      process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123'
      process.env.STRIPE_SECRET_KEY = 'sk_test_123'
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123'
      process.env.SENDGRID_API_KEY = 'SG.test_key'
      process.env.SENDGRID_FROM_EMAIL = 'noreply@kinworkspace.com'
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
      process.env.CLOUDINARY_API_KEY = 'test-key'
      process.env.CLOUDINARY_API_SECRET = 'test-secret'
      
      jest.resetModules()
      const { isDemoMode: isDemoProd, isProductionMode: isProdProd } = require('../app/lib/config')
      
      expect(isDemoProd()).toBe(false)
      expect(isProdProd()).toBe(true)
    })
  })

  describe('Service Integration Readiness', () => {
    test('should validate Stripe integration configuration', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123'
      process.env.STRIPE_PUBLIC_KEY = 'pk_test_123'
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123'

      jest.resetModules()
      const { validateStripeConfig } = require('../app/lib/payment-service')
      const validation = validateStripeConfig()

      expect(validation.isValid).toBe(true)
      expect(validation.publicKey).toBe('pk_test_123')
      expect(validation.hasWebhookSecret).toBe(true)
    })

    test('should validate database connection configuration', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb'
      process.env.DATABASE_POOL_SIZE = '20'
      process.env.DATABASE_POOL_TIMEOUT = '30000'

      jest.resetModules()
      const { validateDatabaseConfig } = require('../app/lib/database-config')
      const validation = validateDatabaseConfig()

      expect(validation.isValid).toBe(true)
      expect(validation.provider).toBe('postgresql')
      expect(validation.poolSize).toBe(20)
      expect(validation.poolTimeout).toBe(30000)
      expect(validation.ssl).toBe(true)
    })

    test('should validate CMS integration configuration', () => {
      process.env.CMS_ENABLED = 'true'
      process.env.CMS_PROVIDER = 'contentful'
      process.env.CMS_ENDPOINT = 'https://api.cms.example.com'
      process.env.CMS_API_KEY = 'cms_key_123'
      process.env.CMS_PROJECT_ID = 'project_123'

      jest.resetModules()
      const { validateCMSConfig } = require('../app/lib/cms-config')
      const validation = validateCMSConfig()

      expect(validation.isValid).toBe(true)
      expect(validation.endpoint).toBe('https://api.cms.example.com')
      expect(validation.hasApiKey).toBe(true)
      expect(validation.hasProjectId).toBe(true)
    })

    test('should validate email service configuration', () => {
      process.env.EMAIL_SERVICE = 'sendgrid'
      process.env.SENDGRID_API_KEY = 'SG.test_key'
      process.env.SENDGRID_FROM_EMAIL = 'noreply@kinworkspace.com'

      jest.resetModules()
      const { validateEmailConfig } = require('../app/lib/config')
      const validation = validateEmailConfig()

      expect(validation.isValid).toBe(true)
      expect(validation.service).toBe('sendgrid')
      expect(validation.hasApiKey).toBe(true)
      expect(validation.fromEmail).toBe('noreply@kinworkspace.com')
    })
  })

  describe('Error Handling and Graceful Degradation', () => {
    test('should handle email service failures gracefully', async () => {
      // Simulate email service unavailable
      process.env.EMAIL_SERVICE = 'sendgrid'
      process.env.SENDGRID_API_KEY = 'invalid_key'

      jest.resetModules()
      const { sendEmail } = require('../app/lib/config')
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test</p>'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.fallbackUsed).toBe(true)
    })

    test('should validate production deployment checklist', () => {
      // Set up production-like environment
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_SITE_URL = 'https://kinworkspace.com'
      process.env.STRIPE_SECRET_KEY = 'sk_live_123'
      process.env.SENDGRID_API_KEY = 'SG.live_key'
      process.env.CLOUDINARY_CLOUD_NAME = 'kinworkspace'
      process.env.SENTRY_DSN = 'https://test@sentry.io/123456'
      process.env.GOOGLE_ANALYTICS_ID = 'GA-123456789'

      jest.resetModules()
      const { getProductionChecklist } = require('../app/lib/config')
      const checklist = getProductionChecklist()

      expect(checklist).toEqual({
        environment: {
          nodeVersion: expect.stringMatching(/^v?\d+\.\d+\.\d+$/),
          nextjsVersion: expect.stringMatching(/^\d+\.\d+\.\d+$/),
          productionMode: true
        },
        security: {
          httpsEnabled: true,
          secretsConfigured: true,
          corsConfigured: true,
          rateLimitingEnabled: false
        },
        database: {
          connectionPoolConfigured: false,
          migrationsApplied: true,
          backupConfigured: false
        },
        monitoring: {
          errorTrackingEnabled: true,
          performanceMonitoringEnabled: true,
          healthChecksConfigured: true
        },
        integrations: {
          paymentServiceReady: true,
          cmsServiceReady: true,
          emailServiceReady: true,
          fileStorageReady: true
        }
      })
    })

    test('should handle database connection failures gracefully', async () => {
      // Simulate database unavailable
      process.env.DATABASE_URL = 'postgresql://invalid:invalid@invalid:5432/invalid'

      jest.resetModules()
      const { testDatabaseConnection } = require('../app/lib/database-config')
      const result = await testDatabaseConnection()

      expect(result.connected).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.fallbackStrategy).toBeDefined()
    })
  })

  describe('Performance and Scalability', () => {
    test('should validate database connection pooling', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb'
      process.env.DATABASE_POOL_SIZE = '20'
      process.env.DATABASE_POOL_TIMEOUT = '30000'

      jest.resetModules()
      const { validateDatabaseConfig } = require('../app/lib/database-config')
      const validation = validateDatabaseConfig()

      expect(validation.poolSize).toBe(20)
      expect(validation.poolTimeout).toBe(30000)
      expect(validation.connectionLimits).toEqual({
        min: 2,
        max: 20
      })
    })

    test('should validate caching configuration', () => {
      process.env.REDIS_URL = 'redis://localhost:6379'
      process.env.CACHE_TTL = '3600'

      jest.resetModules()
      const { validateCacheConfig } = require('../app/lib/config')
      const validation = validateCacheConfig()

      expect(validation.isValid).toBe(true)
      expect(validation.provider).toBe('redis')
      expect(validation.ttl).toBe(3600)
    })

    test('should validate CDN and asset optimization', () => {
      process.env.STORAGE_PROVIDER = 'cloudinary'
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
      process.env.CLOUDINARY_API_KEY = 'test-key'
      process.env.CLOUDINARY_API_SECRET = 'test-secret'

      jest.resetModules()
      const { validateAssetConfig } = require('../app/lib/config')
      const validation = validateAssetConfig()

      expect(validation.isValid).toBe(true)
      expect(validation.cdnConfigured).toBe(true)
      expect(validation.imageOptimizationEnabled).toBe(true)
    })
  })

  describe('Security Configuration', () => {
    test('should validate security headers configuration', () => {
      jest.resetModules()
      const { validateSecurityConfig } = require('../app/lib/config')
      const validation = validateSecurityConfig()

      expect(validation.headers).toEqual({
        contentSecurityPolicy: true,
        strictTransportSecurity: true,
        xFrameOptions: true,
        xContentTypeOptions: true,
        referrerPolicy: true
      })
    })

    test('should validate authentication configuration', () => {
      process.env.JWT_SECRET = 'super-secret-jwt-key-for-production-that-is-long-enough'
      process.env.NEXTAUTH_SECRET = 'super-secret-nextauth-key-for-production-that-is-long-enough'
      process.env.NEXTAUTH_URL = 'https://kinworkspace.com'

      jest.resetModules()
      const { validateAuthConfig } = require('../app/lib/config')
      const validation = validateAuthConfig()

      expect(validation.isValid).toBe(true)
      expect(validation.jwtSecretLength).toBeGreaterThanOrEqual(32)
      expect(validation.nextAuthSecretLength).toBeGreaterThanOrEqual(32)
      expect(validation.secureUrl).toBe(true)
    })

    test('should validate rate limiting configuration', () => {
      process.env.RATE_LIMIT_REQUESTS = '100'
      process.env.RATE_LIMIT_WINDOW = '900000' // 15 minutes

      jest.resetModules()
      const { validateRateLimitConfig } = require('../app/lib/config')
      const validation = validateRateLimitConfig()

      expect(validation.isValid).toBe(true)
      expect(validation.requestsPerWindow).toBe(100)
      expect(validation.windowMs).toBe(900000)
    })
  })

  describe('Monitoring and Observability', () => {
    test('should validate error tracking configuration', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123456'
      process.env.NODE_ENV = 'production'

      jest.resetModules()
      const { validateMonitoringConfig } = require('../app/lib/config')
      const validation = validateMonitoringConfig()

      expect(validation.errorTracking.enabled).toBe(true)
      expect(validation.errorTracking.dsn).toBe('https://test@sentry.io/123456')
    })

    test('should validate analytics configuration', () => {
      process.env.GOOGLE_ANALYTICS_ID = 'GA-123456789'

      jest.resetModules()
      const { validateAnalyticsConfig } = require('../app/lib/config')
      const validation = validateAnalyticsConfig()

      expect(validation.isValid).toBe(true)
      expect(validation.provider).toBe('google-analytics')
      expect(validation.trackingId).toBe('GA-123456789')
    })

    test('should validate health check endpoints', async () => {
      jest.resetModules()
      const { testHealthChecks } = require('../app/lib/config')
      const healthChecks = await testHealthChecks()

      expect(healthChecks).toEqual({
        database: expect.objectContaining({
          status: expect.stringMatching(/^(healthy|unhealthy)$/),
          responseTime: expect.any(Number)
        }),
        cache: expect.objectContaining({
          status: expect.stringMatching(/^(healthy|unhealthy)$/),
          responseTime: expect.any(Number)
        }),
        externalServices: expect.objectContaining({
          payment: expect.objectContaining({
            status: expect.stringMatching(/^(healthy|unhealthy)$/),
            responseTime: expect.any(Number)
          }),
          cms: expect.objectContaining({
            status: expect.stringMatching(/^(healthy|unhealthy)$/),
            responseTime: expect.any(Number)
          })
        })
      })
    })
  })

  describe('Service Integration Validation', () => {
    test('should validate payment service switching', () => {
      // Test demo mode
      process.env.PAYMENT_MODE = 'demo'
      
      jest.resetModules()
      const { isDemoMode } = require('../app/lib/config')
      expect(isDemoMode()).toBe(true)
      
      // Test production mode
      process.env.PAYMENT_MODE = 'production'
      process.env.EMAIL_SERVICE = 'sendgrid'
      process.env.STORAGE_PROVIDER = 'cloudinary'
      process.env.STRIPE_SECRET_KEY = 'sk_test_123'
      process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123'
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123'
      process.env.SENDGRID_API_KEY = 'SG.test_key'
      process.env.SENDGRID_FROM_EMAIL = 'noreply@kinworkspace.com'
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
      process.env.CLOUDINARY_API_KEY = 'test-key'
      process.env.CLOUDINARY_API_SECRET = 'test-secret'
      
      jest.resetModules()
      const { isProductionMode } = require('../app/lib/config')
      expect(isProductionMode()).toBe(true)
    })

    test('should validate CMS service switching', () => {
      // Test demo mode (CMS disabled)
      process.env.CMS_ENABLED = 'false'
      
      jest.resetModules()
      const { getConfig } = require('../app/lib/config')
      const config = getConfig()
      expect(config.cms.enabled).toBe(false)
      
      // Test production mode (CMS enabled)
      process.env.CMS_ENABLED = 'true'
      process.env.CMS_PROVIDER = 'contentful'
      process.env.CMS_ENDPOINT = 'https://api.cms.example.com'
      process.env.CMS_API_KEY = 'cms_key_123'
      
      jest.resetModules()
      const { getConfig: getProdConfig } = require('../app/lib/config')
      const prodConfig = getProdConfig()
      expect(prodConfig.cms.enabled).toBe(true)
      expect(prodConfig.cms.endpoint).toBe('https://api.cms.example.com')
    })
  })
})