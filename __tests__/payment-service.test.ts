import {
  PaymentServiceFactory,
  DemoPaymentService,
  StripePaymentService,
  PaymentMethod,
  PaymentServiceConfig
} from '../app/lib/payment-service'

describe('Payment Service Architecture', () => {
  beforeEach(() => {
    // Reset factory instance before each test
    PaymentServiceFactory.resetInstance()
  })

  describe('PaymentServiceFactory', () => {
    test('should create demo payment service by default', () => {
      const service = PaymentServiceFactory.createPaymentService()
      expect(service).toBeInstanceOf(DemoPaymentService)
      expect(service.isDemo()).toBe(true)
    })

    test('should create demo payment service when mode is demo', () => {
      const config: PaymentServiceConfig = {
        mode: 'demo',
        demoConfig: {
          successRate: 0.8,
          processingDelay: 1000,
          enableFailureSimulation: true,
          demoCardNumbers: ['4111111111111111'],
          autoFailCardNumbers: ['4000000000000002']
        }
      }
      
      const service = PaymentServiceFactory.createPaymentService(config)
      expect(service).toBeInstanceOf(DemoPaymentService)
      expect(service.isDemo()).toBe(true)
    })

    test('should create stripe payment service when mode is production', () => {
      const config: PaymentServiceConfig = {
        mode: 'production',
        stripeConfig: {
          publishableKey: 'pk_test_123',
          secretKey: 'sk_test_123',
          webhookSecret: 'whsec_123'
        }
      }
      
      const service = PaymentServiceFactory.createPaymentService(config)
      expect(service).toBeInstanceOf(StripePaymentService)
      expect(service.isDemo()).toBe(false)
    })

    test('should return singleton instance', () => {
      const service1 = PaymentServiceFactory.getInstance()
      const service2 = PaymentServiceFactory.getInstance()
      expect(service1).toBe(service2)
    })

    test('should reset instance correctly', () => {
      const service1 = PaymentServiceFactory.getInstance()
      PaymentServiceFactory.resetInstance()
      const service2 = PaymentServiceFactory.getInstance()
      expect(service1).not.toBe(service2)
    })
  })

  describe('DemoPaymentService', () => {
    let service: DemoPaymentService
    let config: PaymentServiceConfig

    beforeEach(() => {
      config = {
        mode: 'demo',
        demoConfig: {
          successRate: 1.0, // Always succeed for predictable tests
          processingDelay: 100, // Short delay for tests
          enableFailureSimulation: true,
          demoCardNumbers: ['4111111111111111'],
          autoFailCardNumbers: ['4000000000000002']
        }
      }
      service = new DemoPaymentService(config)
    })

    test('should identify as demo service', () => {
      expect(service.isDemo()).toBe(true)
    })

    test('should process successful payment', async () => {
      const method: PaymentMethod = {
        type: 'card',
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'Test User'
      }

      const result = await service.processPayment(100, method)

      expect(result.success).toBe(true)
      expect(result.paymentId).toMatch(/^demo_/)
      expect(result.transactionId).toMatch(/^txn_/)
      expect(result.receipt).toBeDefined()
      expect(result.receipt?.isDemoTransaction).toBe(true)
      expect(result.receipt?.amount).toBe(100)
      expect(result.receipt?.last4).toBe('1111')
      expect(result.receipt?.brand).toBe('Visa')
    })

    test('should process failed payment with auto-fail card', async () => {
      const method: PaymentMethod = {
        type: 'card',
        cardNumber: '4000000000000002', // Auto-fail card
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'Test User'
      }

      const result = await service.processPayment(100, method)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.paymentId).toMatch(/^demo_/)
    })

    test('should create payment intent', async () => {
      const intent = await service.createPaymentIntent(100)

      expect(intent.id).toMatch(/^pi_demo_/)
      expect(intent.amount).toBe(100)
      expect(intent.currency).toBe('USD')
      expect(intent.status).toBe('requires_payment_method')
      expect(intent.clientSecret).toMatch(/_secret_demo$/)
    })

    test('should validate payment method correctly', () => {
      const validMethod: PaymentMethod = {
        type: 'card',
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'Test User'
      }

      const result = service.validatePaymentMethod(validMethod)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual({})
    })

    test('should reject invalid payment method', () => {
      const invalidMethod: PaymentMethod = {
        type: 'card',
        cardNumber: '1234', // Invalid card number
        expiryDate: '13/25', // Invalid month
        cvv: '12', // Invalid CVV
        cardholderName: '' // Missing name
      }

      const result = service.validatePaymentMethod(invalidMethod)
      expect(result.valid).toBe(false)
      expect(result.errors.cardNumber).toBeDefined()
      expect(result.errors.expiryDate).toBeDefined()
      expect(result.errors.cvv).toBeDefined()
      expect(result.errors.cardholderName).toBeDefined()
    })

    test('should get demo payment methods', async () => {
      const methods = await service.getPaymentMethods()
      expect(methods).toHaveLength(1)
      expect(methods[0].type).toBe('card')
      expect(methods[0].cardNumber).toBe('4111111111111111')
    })

    test('should simulate processing delay', async () => {
      const startTime = Date.now()
      const method: PaymentMethod = {
        type: 'card',
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'Test User'
      }

      await service.processPayment(100, method)
      const endTime = Date.now()

      expect(endTime - startTime).toBeGreaterThanOrEqual(100) // Should take at least the processing delay
    })

    test('should provide demo card numbers', () => {
      const cardNumbers = service.getDemoCardNumbers()
      expect(cardNumbers.success).toContain('4111111111111111')
      expect(cardNumbers.failure).toContain('4000000000000002')
    })

    test('should provide demo scenarios', () => {
      const scenarios = service.getDemoScenarios()
      expect(scenarios).toHaveLength(6)
      expect(scenarios[0].name).toBe('Successful Payment')
      expect(scenarios[0].expectedResult).toBe('success')
      expect(scenarios[3].name).toBe('Card Declined')
      expect(scenarios[3].expectedResult).toBe('failure')
    })

    test('should provide processing stats', () => {
      const stats = service.getProcessingStats()
      expect(stats.successRate).toBe(1.0)
      expect(stats.averageProcessingTime).toBe(100)
      expect(stats.totalTransactions).toBe(0)
    })
  })

  describe('StripePaymentService', () => {
    let service: StripePaymentService
    let config: PaymentServiceConfig

    beforeEach(() => {
      config = {
        mode: 'production',
        stripeConfig: {
          publishableKey: 'pk_test_123',
          secretKey: 'sk_test_123',
          webhookSecret: 'whsec_123'
        }
      }
      service = new StripePaymentService(config)
    })

    test('should identify as production service', () => {
      expect(service.isDemo()).toBe(false)
    })

    test('should throw error for unimplemented methods', async () => {
      const method: PaymentMethod = {
        type: 'card',
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'Test User'
      }

      await expect(service.processPayment(100, method)).rejects.toThrow('not yet implemented')
      await expect(service.createPaymentIntent(100)).rejects.toThrow('not yet implemented')
      await expect(service.confirmPayment('pi_123', method)).rejects.toThrow('not yet implemented')
      await expect(service.getPaymentMethods()).rejects.toThrow('not yet implemented')
    })

    test('should validate payment method using demo validation', () => {
      const validMethod: PaymentMethod = {
        type: 'card',
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'Test User'
      }

      const result = service.validatePaymentMethod(validMethod)
      expect(result.valid).toBe(true)
    })
  })
})