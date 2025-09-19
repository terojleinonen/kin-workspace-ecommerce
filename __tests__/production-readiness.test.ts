/**
 * Production Readiness Tests
 * 
 * Tests environment variable switching between demo and production modes,
 * validates service integrations are ready for production activation,
 * and tests error handling and graceful degradation scenarios.
 */

// Mock environment variables
const originalEnv = process.env

beforeEach(() => {
  jest.resetModules()
  process.env = { ...originalEnv }
})

afterAll(() => {
  process.env = originalEnv
})

describe('Production Readiness Tests', () => {
  describe('Environment Variable Switching', () => {
    test('should switch payment service based on PAYMENT_MODE environment variable', async () => {
      // Test demo mode
      process.env.PAYMENT_MODE = 'demo'
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true'
      
      const { getPaymentService } = await import('../app/lib/service-factory')
      const demoService = getPaymentService()
      
      expect(demoService.isDemo()).toBe(true)
      
      // Test production mode
      process.env.PAYMENT_MODE = 'production'
      process.env.NEXT_PUBLIC_DEMO_MODE = 'false'
      process.env.STRIPE_SECRET_KEY = 'sk_test_123'
      process.env.STRIPE_PUBLIC_KEY = 'pk_test_123'
      
      // Clear module cache to get fresh instance
      jest.resetModules()
      const { getPaymentService: getProdPaymentService } = await import('../app/lib/service-factory')
      const prodService = getProdPaymentService()
      
      expect(prodService.isDemo()).toBe(false)
    })

    test('should switch CMS service based on CMS_MODE environment variable', async () => {
      // Test demo mode
      process.env.CMS_MODE = 'demo'
      
      const { getCMSService } = await import('../app/lib/service-factory')
      const demoService = getCMSService()
      
      expect(demoService.isDemo()).toBe(true)
      
      // Test production mode
      process.env.CMS_MODE = 'production'
      process.env.CMS_ENDPOINT = 'https://api.cms.example.com'
      process.env.CMS_API_KEY = 'cms_key_123'
      
      jest.resetModules()
      const { getCMSService: getProdCMSService } = await import('../app/lib/service-factory')
      const prodService = getProdCMSService()
      
      expect(prodService.isDemo()).toBe(false)
    })

    test('should validate required production environment variables', () => {
      const requiredProdVars = [
        'DATABASE_URL',
        'JWT_SECRET',
        'NEXTAUTH_SECRET',
        'STRIPE_SECRET_KEY',
        'STRIPE_PUBLIC_KEY'
      ]

      // Test missing variables
      requiredProdVars.forEach(varName => {
        delete process.env[varName]
      })

      const { validateProductionConfig } = require('../app/lib/config')
      const validation = validateProductionConfig()

      expect(validation.isValid).toBe(false)
      expect(validation.missingVars).toEqual(expect.arrayContaining(requiredProdVars))
    })

    test('should validate optional production environment variables', () => {
      const optionalProdVars = [
        'CMS_ENDPOINT',
        'CMS_API_KEY',
        'SENDGRID_API_KEY',
        'CLOUDINARY_CLOUD_NAME',
        'SENTRY_DSN'
      ]

      // Set required vars
      process.env.DATABASE_URL = 'postgresql://test'
      process.env.JWT_SECRET = 'test-secret'
      process.env.NEXTAUTH_SECRET = 'nextauth-secret'
      process.env.STRIPE_SECRET_KEY = 'sk_test_123'
      process.env.STRIPE_PUBLIC_KEY = 'pk_test_123'

      const { validateProductionConfig } = require('../app/lib/config')
      const validation = validateProductionConfig()

      expect(validation.isValid).toBe(true)
      expect(validation.warnings).toEqual(expect.arrayContaining(
        optionalProdVars.map(varName => expect.stringContaining(varName))
      ))
    })
  })

  describe('Service Integration Readiness', () => {
    test('should validate Stripe integration configuration', async () => {
      process.env.PAYMENT_MODE = 'production'
      process.env.STRIPE_SECRET_KEY = 'sk_test_123'
      process.env.STRIPE_PUBLIC_KEY = 'pk_test_123'
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123'

      const { validateStripeConfig } = await import('../app/lib/payment-service')
      const validation = validateStripeConfig()

      expect(validation.isValid).toBe(true)
      expect(validation.publicKey).toBe('pk_test_123')
      expect(validation.hasWebhookSecret).toBe(true)
    })

    test('should validate database connection configuration', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb'

      const { validateDatabaseConfig } = await import('../app/lib/database-config')
      const validation = validateDatabaseConfig()

      expect(validation.isValid).toBe(true)
      expect(validation.provider).toBe('postgresql')
      expect(validation.ssl).toBeDefined()
    })

    test('should validate CMS integration configuration', async () => {
      process.env.CMS_MODE = 'production'
      process.env.CMS_ENDPOINT = 'https://api.cms.example.com'
      process.env.CMS_API_KEY = 'cms_key_123'
      process.env.CMS_PROJECT_ID = 'project_123'

      const { validateCMSConfig } = await import('../app/lib/cms-config')
      const validation = validateCMSConfig()

      expect(validation.isValid).toBe(true)
      expect(validation.endpoint).toBe('https://api.cms.example.com')
      expect(validation.hasApiKey).toBe(true)
      expect(validation.hasProjectId).toBe(true)
    })

    test('should validate email service configuration', async () => {
      process.env.EMAIL_SERVICE = 'sendgrid'
      process.env.SENDGRID_API_KEY = 'SG.test_key'
      process.env.SENDGRID_FROM_EMAIL = 'noreply@kinworkspace.com'

      const { validateEmailConfig } = await import('../app/lib/config')
      const validation = validateEmailConfig()

      expect(validation.isValid).toBe(true)
      expect(validation.service).toBe('sendgrid')
      expect(validation.hasApiKey).toBe(true)
      expect(validation.fromEmail).toBe('noreply@kinworkspace.com')
    })
  })

  describe('Error Handling and Graceful Degradation', () => {
    test('should handle payment service failures gracefully', async () => {
      // Simulate Stripe service unavailable
      process.env.PAYMENT_MODE = 'production'
      process.env.STRIPE_SECRET_KEY = 'invalid_key'

      const { getPaymentService } = await import('../app/lib/service-factory')
      const paymentService = getPaymentService()

      const result = await paymentService.processPayment(100, {
        type: 'card',
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'Test User'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('payment service')
      expect(result.fallbackUsed).toBe(true)
    })

    test('should handle CMS service failures gracefully', async () => {
      // Simulate CMS service unavailable
      process.env.CMS_MODE = 'production'
      process.env.CMS_ENDPOINT = 'https://invalid-cms-endpoint.com'

      const { getCMSService } = await import('../app/lib/service-factory')
      const cmsService = getCMSService()

      const result = await cmsService.syncProducts()

      expect(result.success).toBe(true) // Should succeed with fallback
      expect(result.fallbackUsed).toBe(true)
      expect(result.productsUpdated).toBeGreaterThanOrEqual(0)
    })

    test('should handle database connection failures gracefully', async () => {
      // Simulate database unavailable
      process.env.DATABASE_URL = 'postgresql://invalid:invalid@invalid:5432/invalid'

      const { testDatabaseConnection } = await import('../app/lib/database-config')
      const result = await testDatabaseConnection()

      expect(result.connected).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.fallbackStrategy).toBeDefined()
    })

    test('should handle email service failures gracefully', async () => {
      // Simulate email service unavailable
      process.env.EMAIL_SERVICE = 'sendgrid'
      process.env.SENDGRID_API_KEY = 'invalid_key'

      const { sendEmail } = await import('../app/lib/config')
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test</p>'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.fallbackUsed).toBe(true) // Should log to console/file as fallback
    })

    test('should validate production deployment checklist', () => {
      const { getProductionChecklist } = require('../app/lib/config')
      const checklist = getProductionChecklist()

      expect(checklist).toEqual({
        environment: {
          nodeVersion: expect.stringMatching(/^\d+\.\d+\.\d+$/),
          nextjsVersion: expect.stringMatching(/^\d+\.\d+\.\d+$/),
          productionMode: expect.any(Boolean)
        },
        security: {
          httpsEnabled: expect.any(Boolean),
          secretsConfigured: expect.any(Boolean),
          corsConfigured: expect.any(Boolean),
          rateLimitingEnabled: expect.any(Boolean)
        },
        database: {
          connectionPoolConfigured: expect.any(Boolean),
          migrationsApplied: expect.any(Boolean),
          backupConfigured: expect.any(Boolean)
        },
        monitoring: {
          errorTrackingEnabled: expect.any(Boolean),
          performanceMonitoringEnabled: expect.any(Boolean),
          healthChecksConfigured: expect.any(Boolean)
        },
        integrations: {
          paymentServiceReady: expect.any(Boolean),
          cmsServiceReady: expect.any(Boolean),
          emailServiceReady: expect.any(Boolean),
          fileStorageReady: expect.any(Boolean)
        }
      })
    })
  })

  describe('Performance and Scalability', () => {
    test('should validate database connection pooling', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb'
      process.env.DATABASE_POOL_SIZE = '20'
      process.env.DATABASE_POOL_TIMEOUT = '30000'

      const { validateDatabaseConfig } = await import('../app/lib/database-config')
      const validation = validateDatabaseConfig()

      expect(validation.poolSize).toBe(20)
      expect(validation.poolTimeout).toBe(30000)
      expect(validation.connectionLimits).toBeDefined()
    })

    test('should validate caching configuration', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379'
      process.env.CACHE_TTL = '3600'

      const { validateCacheConfig } = await import('../app/lib/config')
      const validation = validateCacheConfig()

      expect(validation.isValid).toBe(true)
      expect(validation.provider).toBe('redis')
      expect(validation.ttl).toBe(3600)
    })

    test('should validate CDN and asset optimization', () => {
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
      process.env.CLOUDINARY_API_KEY = 'test-key'
      process.env.CLOUDINARY_API_SECRET = 'test-secret'

      const { validateAssetConfig } = require('../app/lib/config')
      const validation = validateAssetConfig()

      expect(validation.isValid).toBe(true)
      expect(validation.cdnConfigured).toBe(true)
      expect(validation.imageOptimizationEnabled).toBe(true)
    })
  })

  describe('Security Configuration', () => {
    test('should validate security headers configuration', () => {
      const { validateSecurityConfig } = require('../app/lib/config')
      const validation = validateSecurityConfig()

      expect(validation.headers).toEqual({
        contentSecurityPolicy: expect.any(Boolean),
        strictTransportSecurity: expect.any(Boolean),
        xFrameOptions: expect.any(Boolean),
        xContentTypeOptions: expect.any(Boolean),
        referrerPolicy: expect.any(Boolean)
      })
    })

    test('should validate authentication configuration', () => {
      process.env.JWT_SECRET = 'super-secret-jwt-key-for-production'
      process.env.NEXTAUTH_SECRET = 'super-secret-nextauth-key-for-production'
      process.env.NEXTAUTH_URL = 'https://kinworkspace.com'

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
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true })

      const { validateMonitoringConfig } = require('../app/lib/config')
      const validation = validateMonitoringConfig()

      expect(validation.errorTracking.enabled).toBe(true)
      expect(validation.errorTracking.dsn).toBe('https://test@sentry.io/123456')
    })

    test('should validate analytics configuration', () => {
      process.env.GOOGLE_ANALYTICS_ID = 'GA-123456789'

      const { validateAnalyticsConfig } = require('../app/lib/config')
      const validation = validateAnalyticsConfig()

      expect(validation.isValid).toBe(true)
      expect(validation.provider).toBe('google-analytics')
      expect(validation.trackingId).toBe('GA-123456789')
    })

    test('should validate health check endpoints', async () => {
      const { testHealthChecks } = await import('../app/lib/config')
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
})