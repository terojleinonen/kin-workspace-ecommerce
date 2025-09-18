// Production Services Integration Tests
// Tests for Stripe, SendGrid, Cloudinary, and database configuration

import { 
  StripePaymentService, 
  PaymentServiceConfig,
  PaymentMethod 
} from '../app/lib/payment-service'
import { 
  SendGridEmailService, 
  CloudinaryStorageService,
  EmailMessage,
  StorageFile
} from '../app/lib/service-factory'
import { 
  DatabaseManager, 
  getDatabaseManager,
  validateDatabaseConnection,
  ensureDatabaseReady
} from '../app/lib/database-config'
import { getConfig, resetConfig } from '../app/lib/config'

// Mock environment variables
const originalEnv = process.env

beforeEach(() => {
  resetConfig()
  process.env = { ...originalEnv }
  
  // Set up basic configuration
  process.env.DATABASE_URL = 'file:./test.db'
  process.env.JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-validation'
  process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-that-is-long-enough'
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
})

afterAll(() => {
  process.env = originalEnv
})

describe('Stripe Payment Service', () => {
  let paymentService: StripePaymentService
  let config: PaymentServiceConfig

  beforeEach(() => {
    config = {
      mode: 'production',
      stripeConfig: {
        publishableKey: 'pk_test_123456789',
        secretKey: 'sk_test_123456789',
        webhookSecret: 'whsec_123456789'
      }
    }
    paymentService = new StripePaymentService(config)
  })

  test('should initialize with valid Stripe configuration', () => {
    expect(paymentService.isDemo()).toBe(false)
    expect(paymentService.getStripePublishableKey()).toBe('pk_test_123456789')
    expect(paymentService.getWebhookSecret()).toBe('whsec_123456789')
  })

  test('should throw error with invalid configuration', () => {
    const invalidConfig = {
      mode: 'production' as const,
      stripeConfig: {
        publishableKey: '',
        secretKey: '',
        webhookSecret: ''
      }
    }

    expect(() => new StripePaymentService(invalidConfig)).toThrow('Stripe secret key is required')
  })

  test('should create payment intent successfully', async () => {
    const intent = await paymentService.createPaymentIntent(2000, 'USD')

    expect(intent.id).toMatch(/^pi_/)
    expect(intent.amount).toBe(2000)
    expect(intent.currency).toBe('USD')
    expect(intent.status).toBe('requires_payment_method')
    expect(intent.clientSecret).toContain('secret')
  })

  test('should process payment successfully', async () => {
    const method: PaymentMethod = {
      type: 'card',
      cardNumber: '4111111111111111',
      expiryDate: '12/25',
      cvv: '123',
      cardholderName: 'Test User'
    }

    const result = await paymentService.processPayment(2000, method)

    expect(result.success).toBe(true)
    expect(result.paymentId).toMatch(/^pi_/)
    expect(result.transactionId).toMatch(/^ch_/)
    expect(result.receipt).toBeDefined()
    expect(result.receipt?.isDemoTransaction).toBe(false)
    expect(result.receipt?.last4).toBe('1111')
    expect(result.receipt?.brand).toBe('Visa')
  })

  test('should handle payment failure', async () => {
    const method: PaymentMethod = {
      type: 'card',
      cardNumber: '4000000000000002', // Stripe test card for declined
      expiryDate: '12/25',
      cvv: '123',
      cardholderName: 'Test User'
    }

    const result = await paymentService.processPayment(2000, method)

    expect(result.success).toBe(false)
    expect(result.error).toContain('declined')
  })

  test('should confirm payment intent', async () => {
    const method: PaymentMethod = {
      type: 'card',
      cardNumber: '4111111111111111',
      expiryDate: '12/25',
      cvv: '123',
      cardholderName: 'Test User'
    }

    const result = await paymentService.confirmPayment('pi_test_123', method)

    expect(result.success).toBe(true)
    expect(result.paymentId).toBe('pi_test_123')
  })

  test('should validate payment methods correctly', () => {
    const validMethod: PaymentMethod = {
      type: 'card',
      cardNumber: '4111111111111111',
      expiryDate: '12/25',
      cvv: '123',
      cardholderName: 'Test User'
    }

    const validation = paymentService.validatePaymentMethod(validMethod)
    expect(validation.valid).toBe(true)
    expect(Object.keys(validation.errors)).toHaveLength(0)

    const invalidMethod: PaymentMethod = {
      type: 'card',
      cardNumber: '1234',
      expiryDate: '13/20',
      cvv: '12',
      cardholderName: ''
    }

    const invalidValidation = paymentService.validatePaymentMethod(invalidMethod)
    expect(invalidValidation.valid).toBe(false)
    expect(invalidValidation.errors.cardNumber).toBeDefined()
    expect(invalidValidation.errors.expiryDate).toBeDefined()
    expect(invalidValidation.errors.cvv).toBeDefined()
    expect(invalidValidation.errors.cardholderName).toBeDefined()
  })

  test('should handle webhooks', async () => {
    const webhookPayload = JSON.stringify({
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_123',
          status: 'succeeded'
        }
      }
    })

    const result = await paymentService.handleWebhook(webhookPayload, 'test_signature')

    expect(result.success).toBe(true)
    expect(result.event).toBeDefined()
  })
})

describe('SendGrid Email Service', () => {
  let emailService: SendGridEmailService

  beforeEach(() => {
    const config = {
      apiKey: 'SG.test123456789',
      fromEmail: 'noreply@kinworkspace.com',
      fromName: 'Kin Workspace'
    }
    emailService = new SendGridEmailService(config)
  })

  test('should initialize with valid SendGrid configuration', () => {
    expect(emailService.isDemo()).toBe(false)
    expect(emailService.getSendGridApiKey()).toBe('SG.test123456789')
    expect(emailService.getFromEmail()).toBe('noreply@kinworkspace.com')
  })

  test('should throw error with invalid configuration', () => {
    expect(() => new SendGridEmailService({ apiKey: '', fromEmail: '', fromName: '' }))
      .toThrow('SendGrid API key is required')
  })

  test('should send email successfully', async () => {
    const message: EmailMessage = {
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<p>Test content</p>',
      text: 'Test content'
    }

    const result = await emailService.sendEmail(message)

    expect(result.success).toBe(true)
    expect(result.messageId).toMatch(/^sg_/)
    expect(result.deliveryTime).toBeDefined()
  })

  test('should handle email failure', async () => {
    const message: EmailMessage = {
      to: 'fail@example.com', // Triggers simulated failure
      subject: 'Test Email',
      html: '<p>Test content</p>'
    }

    const result = await emailService.sendEmail(message)

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  test('should send order confirmation email', async () => {
    const orderData = {
      total: '99.99',
      items: [
        { name: 'Test Product', quantity: 1, price: '99.99' }
      ]
    }

    const result = await emailService.sendOrderConfirmation(
      'order_123',
      'customer@example.com',
      orderData
    )

    expect(result.success).toBe(true)
    expect(result.messageId).toBeDefined()
  })

  test('should send password reset email', async () => {
    const result = await emailService.sendPasswordReset(
      'user@example.com',
      'reset_token_123'
    )

    expect(result.success).toBe(true)
    expect(result.messageId).toBeDefined()
  })

  test('should send welcome email', async () => {
    const result = await emailService.sendWelcomeEmail(
      'newuser@example.com',
      'John Doe'
    )

    expect(result.success).toBe(true)
    expect(result.messageId).toBeDefined()
  })

  test('should handle SendGrid webhooks', async () => {
    const webhookPayload = [
      {
        event: 'delivered',
        email: 'test@example.com',
        timestamp: Date.now()
      },
      {
        event: 'open',
        email: 'test@example.com',
        timestamp: Date.now()
      }
    ]

    const result = await emailService.handleWebhook(webhookPayload, 'test_signature')

    expect(result.success).toBe(true)
    expect(result.events).toHaveLength(2)
  })
})

describe('Cloudinary Storage Service', () => {
  let storageService: CloudinaryStorageService

  beforeEach(() => {
    const config = {
      cloudName: 'test-cloud',
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret'
    }
    storageService = new CloudinaryStorageService(config)
  })

  test('should initialize with valid Cloudinary configuration', () => {
    expect(storageService.isDemo()).toBe(false)
    expect(storageService.getCloudName()).toBe('test-cloud')
  })

  test('should throw error with invalid configuration', () => {
    expect(() => new CloudinaryStorageService({ cloudName: '', apiKey: '', apiSecret: '' }))
      .toThrow('Cloudinary credentials are required')
  })

  test('should upload file successfully', async () => {
    const file: StorageFile = {
      filename: 'test.jpg',
      buffer: Buffer.from('test file content'),
      mimetype: 'image/jpeg',
      size: 1024
    }

    const result = await storageService.uploadFile(file, 'products')

    expect(result.success).toBe(true)
    expect(result.url).toContain('cloudinary.com')
    expect(result.publicId).toContain('products/')
  })

  test('should handle upload failure for large files', async () => {
    const file: StorageFile = {
      filename: 'large.jpg',
      buffer: Buffer.alloc(15 * 1024 * 1024), // 15MB file
      mimetype: 'image/jpeg',
      size: 15 * 1024 * 1024
    }

    const result = await storageService.uploadFile(file)

    expect(result.success).toBe(false)
    expect(result.error).toContain('too large')
  })

  test('should delete file successfully', async () => {
    const result = await storageService.deleteFile('products/test_image')

    expect(result).toBe(true)
  })

  test('should generate file URLs correctly', () => {
    const url = storageService.getFileUrl('products/test_image')
    expect(url).toBe('https://res.cloudinary.com/test-cloud/image/upload/products/test_image')

    const transformedUrl = storageService.getFileUrl('products/test_image', {
      width: 400,
      height: 300,
      crop: 'fill'
    })
    expect(transformedUrl).toContain('w_400,h_300,c_fill')
  })

  test('should generate optimized image URLs', () => {
    const optimizedUrl = storageService.getOptimizedImageUrl('products/test_image', {
      width: 800,
      quality: 'auto',
      format: 'webp'
    })

    expect(optimizedUrl).toContain('w_800')
    expect(optimizedUrl).toContain('q_auto')
    expect(optimizedUrl).toContain('f_webp')
  })

  test('should generate responsive image URLs', () => {
    const responsiveUrls = storageService.getResponsiveImageUrls('products/test_image')

    expect(responsiveUrls.thumbnail).toContain('w_150,h_150')
    expect(responsiveUrls.small).toContain('w_400')
    expect(responsiveUrls.medium).toContain('w_800')
    expect(responsiveUrls.large).toContain('w_1200')
    expect(responsiveUrls.original).not.toContain('w_')
  })

  test('should upload multiple files', async () => {
    const files: StorageFile[] = [
      {
        filename: 'test1.jpg',
        buffer: Buffer.from('test file 1'),
        mimetype: 'image/jpeg',
        size: 1024
      },
      {
        filename: 'test2.jpg',
        buffer: Buffer.from('test file 2'),
        mimetype: 'image/jpeg',
        size: 2048
      }
    ]

    const results = await storageService.uploadMultipleFiles(files, 'batch')

    expect(results).toHaveLength(2)
    expect(results[0].success).toBe(true)
    expect(results[1].success).toBe(true)
  })

  test('should delete multiple files', async () => {
    const publicIds = ['products/test1', 'products/test2', 'products/test3']

    const result = await storageService.deleteMultipleFiles(publicIds)

    expect(result.success).toBe(3)
    expect(result.failed).toBe(0)
    expect(result.results).toHaveLength(3)
  })

  test('should generate signed upload URLs', () => {
    const signedUrl = storageService.generateSignedUploadUrl('uploads', {
      maxFileSize: 5 * 1024 * 1024,
      allowedFormats: ['jpg', 'png', 'webp']
    })

    expect(signedUrl.url).toContain('cloudinary.com')
    expect(signedUrl.signature).toMatch(/^demo_signature_/)
    expect(signedUrl.timestamp).toBeGreaterThan(0)
  })
})

describe('Database Configuration', () => {
  let databaseManager: DatabaseManager

  beforeEach(() => {
    databaseManager = getDatabaseManager()
  })

  test('should initialize database manager', () => {
    expect(databaseManager).toBeDefined()
    
    const config = databaseManager.getConnectionConfig()
    expect(config.url).toBeDefined()
    expect(config.provider).toBeDefined()
  })

  test('should validate database connection', async () => {
    const result = await databaseManager.validateConnection()

    expect(result.valid).toBe(true)
    expect(result.provider).toBeDefined()
  })

  test('should check migration status', async () => {
    const status = await databaseManager.checkMigrationStatus()

    expect(status.needsMigration).toBe(false)
    expect(status.pendingMigrations).toBeDefined()
    expect(status.currentVersion).toBeDefined()
  })

  test('should run migrations in dry run mode', async () => {
    const result = await databaseManager.runMigrations({ dryRun: true })

    expect(result.success).toBe(true)
    expect(result.migrationsRun).toBeDefined()
  })

  test('should create database backup', async () => {
    const backupPath = await databaseManager.createDatabaseBackup()

    expect(backupPath).toContain('database_backup_')
    expect(backupPath).toContain('.sql')
  })

  test('should seed database', async () => {
    const result = await databaseManager.seedDatabase({ environment: 'demo' })

    expect(result.success).toBe(true)
    expect(result.seedsRun).toContain('demo_users')
    expect(result.seedsRun).toContain('demo_products')
  })

  test('should reset database in demo mode only', async () => {
    process.env.PAYMENT_MODE = 'demo'
    resetConfig()

    const result = await databaseManager.resetDatabase()

    expect(result.success).toBe(true)
  })

  test('should prevent database reset in production mode', async () => {
    process.env.PAYMENT_MODE = 'production'
    process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123456789'
    process.env.STRIPE_SECRET_KEY = 'sk_test_123456789'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123456789'
    process.env.EMAIL_SERVICE = 'demo'
    process.env.STORAGE_PROVIDER = 'local'
    resetConfig()

    const result = await databaseManager.resetDatabase()

    expect(result.success).toBe(false)
    expect(result.error).toContain('only allowed in demo mode')
  })

  test('should get database statistics', async () => {
    const stats = await databaseManager.getDatabaseStats()

    expect(stats.provider).toBeDefined()
    expect(stats.tables).toBeGreaterThan(0)
    expect(stats.records).toBeDefined()
    expect(stats.records.users).toBeGreaterThanOrEqual(0)
  })

  test('should perform health check', async () => {
    const health = await databaseManager.healthCheck()

    expect(health.healthy).toBe(true)
    expect(health.responseTime).toBeGreaterThan(0)
    expect(health.details.connection).toBe(true)
    expect(health.details.migrations).toBe(true)
    expect(health.details.readWrite).toBe(true)
  })

  test('should validate database connection helper', async () => {
    const isValid = await validateDatabaseConnection()
    expect(isValid).toBe(true)
  })

  test('should ensure database is ready', async () => {
    // Should not throw in demo mode
    await expect(ensureDatabaseReady()).resolves.not.toThrow()
  })
})