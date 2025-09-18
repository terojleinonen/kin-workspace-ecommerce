// Configuration System Tests
// Tests for environment configuration parsing, validation, and service factory

import { 
  getConfig, 
  resetConfig, 
  isDemoMode, 
  isProductionMode, 
  getConfigSummary,
  ConfigValidationError,
  CONFIG_PRESETS
} from '../app/lib/config'
import { 
  ServiceFactory, 
  getPaymentService, 
  getEmailService, 
  getStorageService,
  checkServiceHealth
} from '../app/lib/service-factory'

// Mock environment variables
const originalEnv = process.env

beforeEach(() => {
  // Reset configuration and services before each test
  resetConfig()
  ServiceFactory.resetServices()
  
  // Reset environment variables
  process.env = { ...originalEnv }
})

afterAll(() => {
  // Restore original environment
  process.env = originalEnv
})

describe('Configuration System', () => {
  describe('Environment Variable Parsing', () => {
    test('should parse demo mode configuration correctly', () => {
      // Set demo mode environment variables
      process.env.PAYMENT_MODE = 'demo'
      process.env.DATABASE_URL = 'file:./test.db'
      process.env.JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-validation'
      process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-that-is-long-enough'
      process.env.NEXTAUTH_URL = 'http://localhost:3000'
      process.env.DEMO_SUCCESS_RATE = '0.9'
      process.env.DEMO_PROCESSING_DELAY = '1500'

      const config = getConfig()

      expect(config.mode).toBe('demo')
      expect(config.payment.mode).toBe('demo')
      expect(config.payment.demo?.successRate).toBe(0.9)
      expect(config.payment.demo?.processingDelay).toBe(1500)
      expect(config.email.service).toBe('demo')
      expect(config.storage.provider).toBe('local')
    })

    test('should parse production mode configuration correctly', () => {
      // Set production mode environment variables
      process.env.PAYMENT_MODE = 'production'
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.JWT_SECRET = 'production-jwt-secret-that-is-long-enough'
      process.env.NEXTAUTH_SECRET = 'production-nextauth-secret-that-is-long-enough'
      process.env.NEXTAUTH_URL = 'https://example.com'
      process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123456789'
      process.env.STRIPE_SECRET_KEY = 'sk_test_123456789'
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123456789'
      process.env.EMAIL_SERVICE = 'sendgrid'
      process.env.SENDGRID_API_KEY = 'SG.test123456789'
      process.env.SENDGRID_FROM_EMAIL = 'noreply@example.com'
      process.env.STORAGE_PROVIDER = 'cloudinary'
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
      process.env.CLOUDINARY_API_KEY = 'test-api-key'
      process.env.CLOUDINARY_API_SECRET = 'test-api-secret'

      const config = getConfig()

      expect(config.mode).toBe('production')
      expect(config.payment.mode).toBe('production')
      expect(config.payment.stripe?.publishableKey).toBe('pk_test_123456789')
      expect(config.email.service).toBe('sendgrid')
      expect(config.email.sendgrid?.apiKey).toBe('SG.test123456789')
    })

    test('should use default values when optional environment variables are missing', () => {
      // Set only required environment variables
      process.env.DATABASE_URL = 'file:./test.db'
      process.env.JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-validation'
      process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-that-is-long-enough'
      process.env.NEXTAUTH_URL = 'http://localhost:3000'

      const config = getConfig()

      expect(config.mode).toBe('demo') // Default mode
      expect(config.payment.demo?.successRate).toBe(0.8) // Default success rate
      expect(config.payment.demo?.processingDelay).toBe(2000) // Default delay
      expect(config.siteName).toBe('Kin Workspace') // Default site name
    })
  })

  describe('Configuration Validation', () => {
    test('should throw error for missing required environment variables', () => {
      // Don't set required variables
      delete process.env.DATABASE_URL
      delete process.env.JWT_SECRET

      expect(() => getConfig()).toThrow(ConfigValidationError)
    })

    test('should throw error for invalid JWT secret length', () => {
      resetConfig() // Reset cached config
      process.env.DATABASE_URL = 'file:./test.db'
      process.env.JWT_SECRET = 'short' // Too short
      process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-that-is-long-enough'
      process.env.NEXTAUTH_URL = 'http://localhost:3000'

      expect(() => getConfig()).toThrow(ConfigValidationError)
      expect(() => getConfig()).toThrow(/JWT secret must be at least 32 characters/)
    })

    test('should throw error for invalid demo success rate', () => {
      resetConfig() // Reset cached config
      process.env.DATABASE_URL = 'file:./test.db'
      process.env.JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-validation'
      process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-that-is-long-enough'
      process.env.NEXTAUTH_URL = 'http://localhost:3000'
      process.env.DEMO_SUCCESS_RATE = '1.5' // Invalid rate > 1

      expect(() => getConfig()).toThrow(ConfigValidationError)
      expect(() => getConfig()).toThrow(/Demo success rate must be between 0 and 1/)
    })

    test('should throw error for invalid Stripe keys in production mode', () => {
      resetConfig() // Reset cached config
      process.env.PAYMENT_MODE = 'production'
      process.env.DATABASE_URL = 'file:./test.db'
      process.env.JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-validation'
      process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-that-is-long-enough'
      process.env.NEXTAUTH_URL = 'http://localhost:3000'
      process.env.STRIPE_PUBLISHABLE_KEY = 'invalid_key' // Should start with pk_
      process.env.STRIPE_SECRET_KEY = 'sk_test_123456789'
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123456789'
      process.env.EMAIL_SERVICE = 'demo' // Use demo to avoid SendGrid requirement
      process.env.STORAGE_PROVIDER = 'local' // Use local to avoid Cloudinary requirement

      expect(() => getConfig()).toThrow(ConfigValidationError)
      expect(() => getConfig()).toThrow(/Stripe publishable key must start with "pk_"/)
    })

    test('should throw error for invalid email configuration', () => {
      process.env.DATABASE_URL = 'file:./test.db'
      process.env.JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-validation'
      process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-that-is-long-enough'
      process.env.NEXTAUTH_URL = 'http://localhost:3000'
      process.env.EMAIL_SERVICE = 'sendgrid'
      process.env.SENDGRID_API_KEY = 'invalid_key' // Should start with SG.
      process.env.SENDGRID_FROM_EMAIL = 'invalid-email' // Invalid email format

      expect(() => getConfig()).toThrow(ConfigValidationError)
    })
  })

  describe('Configuration Helpers', () => {
    test('isDemoMode should return correct value', () => {
      process.env.PAYMENT_MODE = 'demo'
      process.env.DATABASE_URL = 'file:./test.db'
      process.env.JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-validation'
      process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-that-is-long-enough'
      process.env.NEXTAUTH_URL = 'http://localhost:3000'

      expect(isDemoMode()).toBe(true)
      expect(isProductionMode()).toBe(false)
    })

    test('isProductionMode should return correct value', () => {
      resetConfig() // Reset cached config
      process.env.PAYMENT_MODE = 'production'
      process.env.DATABASE_URL = 'file:./test.db'
      process.env.JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-validation'
      process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-that-is-long-enough'
      process.env.NEXTAUTH_URL = 'http://localhost:3000'
      process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123456789'
      process.env.STRIPE_SECRET_KEY = 'sk_test_123456789'
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123456789'
      process.env.EMAIL_SERVICE = 'demo' // Use demo to avoid SendGrid requirement
      process.env.STORAGE_PROVIDER = 'local' // Use local to avoid Cloudinary requirement

      expect(isProductionMode()).toBe(true)
      expect(isDemoMode()).toBe(false)
    })

    test('getConfigSummary should return sanitized configuration', () => {
      process.env.DATABASE_URL = 'file:./test.db'
      process.env.JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-validation'
      process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-that-is-long-enough'
      process.env.NEXTAUTH_URL = 'http://localhost:3000'

      const summary = getConfigSummary()

      expect(summary.mode).toBe('demo')
      expect(summary.database.hasUrl).toBe(true)
      expect(summary.payment.mode).toBe('demo')
      expect(summary.payment.hasDemoConfig).toBe(true)
      
      // Should not expose sensitive data
      expect(summary).not.toHaveProperty('jwtSecret')
      expect(summary).not.toHaveProperty('stripeSecretKey')
    })
  })

  describe('Configuration Presets', () => {
    test('should have valid demo preset', () => {
      const demoPreset = CONFIG_PRESETS.demo

      expect(demoPreset.PAYMENT_MODE).toBe('demo')
      expect(demoPreset.EMAIL_SERVICE).toBe('demo')
      expect(demoPreset.STORAGE_PROVIDER).toBe('local')
      expect(demoPreset.CMS_ENABLED).toBe('false')
      expect(demoPreset.MONITORING_ENABLED).toBe('false')
    })

    test('should have valid production preset', () => {
      const productionPreset = CONFIG_PRESETS.production

      expect(productionPreset.PAYMENT_MODE).toBe('production')
      expect(productionPreset.EMAIL_SERVICE).toBe('sendgrid')
      expect(productionPreset.STORAGE_PROVIDER).toBe('cloudinary')
      expect(productionPreset.CMS_ENABLED).toBe('true')
      expect(productionPreset.MONITORING_ENABLED).toBe('true')
    })
  })
})

describe('Service Factory', () => {
  beforeEach(() => {
    // Set up basic demo configuration for service tests
    process.env.PAYMENT_MODE = 'demo'
    process.env.DATABASE_URL = 'file:./test.db'
    process.env.JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-validation'
    process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-that-is-long-enough'
    process.env.NEXTAUTH_URL = 'http://localhost:3000'
  })

  describe('Payment Service Factory', () => {
    test('should create demo payment service in demo mode', () => {
      const paymentService = getPaymentService()

      expect(paymentService).toBeDefined()
      expect(paymentService.isDemo()).toBe(true)
    })

    test('should create same instance on multiple calls (singleton)', () => {
      const service1 = getPaymentService()
      const service2 = getPaymentService()

      expect(service1).toBe(service2)
    })

    test('should create new instance after reset', () => {
      const service1 = getPaymentService()
      ServiceFactory.resetServices()
      const service2 = getPaymentService()

      expect(service1).not.toBe(service2)
    })
  })

  describe('Email Service Factory', () => {
    test('should create demo email service in demo mode', () => {
      const emailService = getEmailService()

      expect(emailService).toBeDefined()
      expect(emailService.isDemo()).toBe(true)
    })

    test('should throw error for production email service when not implemented', () => {
      process.env.EMAIL_SERVICE = 'sendgrid'
      process.env.SENDGRID_API_KEY = 'SG.test123456789'
      process.env.SENDGRID_FROM_EMAIL = 'test@example.com'

      const emailService = getEmailService()
      expect(emailService).toBeDefined()
      expect(emailService.isDemo()).toBe(false)

      // Should throw when trying to send email (not implemented yet)
      expect(async () => {
        await emailService.sendEmail({
          to: 'test@example.com',
          subject: 'Test',
          html: '<p>Test</p>'
        })
      }).rejects.toThrow(/not yet implemented/)
    })
  })

  describe('Storage Service Factory', () => {
    test('should create local storage service in demo mode', () => {
      const storageService = getStorageService()

      expect(storageService).toBeDefined()
      expect(storageService.isDemo()).toBe(true)
    })

    test('should throw error for unsupported storage provider', () => {
      process.env.STORAGE_PROVIDER = 'invalid_provider'

      expect(() => getStorageService()).toThrow(/Unsupported storage provider/)
    })
  })

  describe('Service Status and Health Checks', () => {
    test('should return service status summary', () => {
      // Initialize services
      getPaymentService()
      getEmailService()
      getStorageService()

      const status = ServiceFactory.getServiceStatus()

      expect(status.payment.mode).toBe('demo')
      expect(status.payment.service).toBe('DemoPaymentService')
      expect(status.payment.isDemo).toBe(true)

      expect(status.email.service).toBe('demo')
      expect(status.email.provider).toBe('DemoEmailService')
      expect(status.email.isDemo).toBe(true)

      expect(status.storage.provider).toBe('local')
      expect(status.storage.service).toBe('LocalStorageService')
      expect(status.storage.isDemo).toBe(true)
    })

    test('should validate all services successfully in demo mode', async () => {
      const validation = await ServiceFactory.validateServices()

      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    test('should perform health check on all services', async () => {
      const health = await checkServiceHealth()

      expect(health.healthy).toBe(true)
      expect(health.services.payment.status).toBe('healthy')
      expect(health.services.email.status).toBe('healthy')
      expect(health.services.storage.status).toBe('healthy')
    })

    test('should detect unhealthy services', async () => {
      // Force an error by setting invalid configuration
      process.env.EMAIL_SERVICE = 'invalid_service'
      ServiceFactory.resetServices()

      const health = await checkServiceHealth()

      expect(health.healthy).toBe(false)
      expect(health.services.email.status).toBe('error')
      expect(health.services.email.message).toContain('Unsupported email service')
    })
  })
})

describe('Demo Email Service', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = 'file:./test.db'
    process.env.JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-validation'
    process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-that-is-long-enough'
    process.env.NEXTAUTH_URL = 'http://localhost:3000'
    process.env.EMAIL_SERVICE = 'demo'
    process.env.DEMO_EMAIL_DELAY = '100' // Fast for testing
  })

  test('should send demo email successfully', async () => {
    const emailService = getEmailService()
    
    const result = await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<p>Test content</p>',
      text: 'Test content'
    })

    expect(result.success).toBe(true)
    expect(result.messageId).toMatch(/^demo_/)
    expect(result.deliveryTime).toBe(100)
  })

  test('should send order confirmation email', async () => {
    const emailService = getEmailService()
    
    const result = await emailService.sendOrderConfirmation(
      'order_123',
      'customer@example.com',
      { total: '99.99' }
    )

    expect(result.success).toBe(true)
    expect(result.messageId).toBeDefined()
  })

  test('should send password reset email', async () => {
    const emailService = getEmailService()
    
    const result = await emailService.sendPasswordReset(
      'user@example.com',
      'reset_token_123'
    )

    expect(result.success).toBe(true)
    expect(result.messageId).toBeDefined()
  })

  test('should send welcome email', async () => {
    const emailService = getEmailService()
    
    const result = await emailService.sendWelcomeEmail(
      'newuser@example.com',
      'John Doe'
    )

    expect(result.success).toBe(true)
    expect(result.messageId).toBeDefined()
  })
})

describe('Local Storage Service', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = 'file:./test.db'
    process.env.JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-validation'
    process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-that-is-long-enough'
    process.env.NEXTAUTH_URL = 'http://localhost:3000'
    process.env.STORAGE_PROVIDER = 'local'
  })

  test('should upload file successfully', async () => {
    const storageService = getStorageService()
    
    const file = {
      filename: 'test.jpg',
      buffer: Buffer.from('test file content'),
      mimetype: 'image/jpeg',
      size: 1024
    }

    const result = await storageService.uploadFile(file, 'products')

    expect(result.success).toBe(true)
    expect(result.url).toContain('/uploads/products/')
    expect(result.publicId).toContain('products/')
  })

  test('should generate correct file URL', () => {
    const storageService = getStorageService()
    
    const url = storageService.getFileUrl('products/test.jpg')

    expect(url).toBe('/uploads/products/test.jpg')
  })

  test('should delete file successfully', async () => {
    const storageService = getStorageService()
    
    const result = await storageService.deleteFile('products/test.jpg')

    expect(result).toBe(true)
  })
})