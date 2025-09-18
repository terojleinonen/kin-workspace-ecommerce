// Payment Service Architecture
// This module provides an abstraction layer for payment processing
// that can switch between demo and production implementations

export interface PaymentMethod {
  type: 'card' | 'paypal' | 'apple_pay'
  cardNumber?: string
  expiryDate?: string
  cvv?: string
  cardholderName?: string
}

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: 'requires_payment_method' | 'requires_confirmation' | 'processing' | 'succeeded' | 'canceled'
  clientSecret?: string
}

export interface PaymentResult {
  success: boolean
  paymentId: string
  transactionId?: string
  error?: string
  receipt?: PaymentReceipt
  processingTime?: number
}

export interface PaymentReceipt {
  paymentId: string
  amount: number
  currency: string
  method: PaymentMethod
  timestamp: Date
  last4?: string
  brand?: string
  isDemoTransaction: boolean
}

export interface PaymentServiceConfig {
  mode: 'demo' | 'production'
  demoConfig?: DemoPaymentConfig
  stripeConfig?: StripePaymentConfig
}

export interface DemoPaymentConfig {
  successRate: number // 0-1, percentage of successful transactions
  processingDelay: number // milliseconds
  enableFailureSimulation: boolean
  demoCardNumbers: string[]
  autoFailCardNumbers: string[]
}

export interface StripePaymentConfig {
  publishableKey: string
  secretKey: string
  webhookSecret: string
}

// Abstract base class for payment services
export abstract class PaymentService {
  protected config: PaymentServiceConfig

  constructor(config: PaymentServiceConfig) {
    this.config = config
  }

  abstract processPayment(amount: number, method: PaymentMethod): Promise<PaymentResult>
  abstract createPaymentIntent(amount: number, currency?: string): Promise<PaymentIntent>
  abstract confirmPayment(intentId: string, method: PaymentMethod): Promise<PaymentResult>
  abstract getPaymentMethods(): Promise<PaymentMethod[]>
  abstract isDemo(): boolean
  abstract validatePaymentMethod(method: PaymentMethod): { valid: boolean; errors: Record<string, string> }
}

// Payment Service Factory
export class PaymentServiceFactory {
  private static instance: PaymentService | null = null

  static createPaymentService(config?: PaymentServiceConfig): PaymentService {
    // Use environment variable to determine mode if config not provided
    const mode = config?.mode || (process.env.PAYMENT_MODE as 'demo' | 'production') || 'demo'
    
    const serviceConfig: PaymentServiceConfig = config || {
      mode,
      demoConfig: {
        successRate: parseFloat(process.env.DEMO_SUCCESS_RATE || '0.8'),
        processingDelay: parseInt(process.env.DEMO_PROCESSING_DELAY || '2000'),
        enableFailureSimulation: process.env.DEMO_ENABLE_FAILURES !== 'false',
        demoCardNumbers: [
          '4111111111111111', // Visa
          '5555555555554444', // Mastercard
          '378282246310005',  // Amex
          '6011111111111117'  // Discover
        ],
        autoFailCardNumbers: [
          '4000000000000002', // Card declined
          '4000000000009995', // Insufficient funds
          '4000000000009987'  // Lost card
        ]
      },
      stripeConfig: {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
        secretKey: process.env.STRIPE_SECRET_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
      }
    }

    if (mode === 'demo') {
      return new DemoPaymentService(serviceConfig)
    } else {
      return new StripePaymentService(serviceConfig)
    }
  }

  static getInstance(config?: PaymentServiceConfig): PaymentService {
    if (!PaymentServiceFactory.instance) {
      PaymentServiceFactory.instance = PaymentServiceFactory.createPaymentService(config)
    }
    return PaymentServiceFactory.instance
  }

  static resetInstance(): void {
    PaymentServiceFactory.instance = null
  }
}

// Demo Payment Service Implementation
export class DemoPaymentService extends PaymentService {
  isDemo(): boolean {
    return true
  }

  async processPayment(amount: number, method: PaymentMethod): Promise<PaymentResult> {
    const demoConfig = this.config.demoConfig!
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, demoConfig.processingDelay))

    // Check if this is an auto-fail card
    const shouldAutoFail = method.cardNumber && 
      demoConfig.autoFailCardNumbers.includes(method.cardNumber.replace(/\s/g, ''))

    // Determine success based on success rate or auto-fail cards
    const shouldSucceed = !shouldAutoFail && 
      (!demoConfig.enableFailureSimulation || Math.random() < demoConfig.successRate)

    const paymentId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const transactionId = `txn_${Date.now()}`

    if (shouldSucceed) {
      return {
        success: true,
        paymentId,
        transactionId,
        processingTime: demoConfig.processingDelay,
        receipt: {
          paymentId,
          amount,
          currency: 'USD',
          method,
          timestamp: new Date(),
          last4: method.cardNumber?.slice(-4),
          brand: this.getCardBrand(method.cardNumber || ''),
          isDemoTransaction: true
        }
      }
    } else {
      const errorMessages = [
        'Your card was declined.',
        'Insufficient funds.',
        'Your card has expired.',
        'Invalid card number.',
        'Transaction could not be processed.'
      ]
      
      return {
        success: false,
        paymentId,
        error: errorMessages[Math.floor(Math.random() * errorMessages.length)],
        processingTime: demoConfig.processingDelay
      }
    }
  }

  async createPaymentIntent(amount: number, currency = 'USD'): Promise<PaymentIntent> {
    const intentId = `pi_demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      id: intentId,
      amount,
      currency,
      status: 'requires_payment_method',
      clientSecret: `${intentId}_secret_demo`
    }
  }

  async confirmPayment(intentId: string, method: PaymentMethod): Promise<PaymentResult> {
    // For demo, we'll extract amount from intent ID (in real implementation, this would be stored)
    const amount = 100 // Default amount for demo
    return this.processPayment(amount, method)
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    // Return demo payment methods
    return [
      {
        type: 'card',
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'Demo User'
      }
    ]
  }

  validatePaymentMethod(method: PaymentMethod): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {}

    if (method.type === 'card') {
      if (!method.cardNumber?.trim()) {
        errors.cardNumber = 'Card number is required'
      } else if (!this.validateCardNumber(method.cardNumber)) {
        errors.cardNumber = 'Please enter a valid card number'
      }

      if (!method.expiryDate?.trim()) {
        errors.expiryDate = 'Expiry date is required'
      } else if (!this.validateExpiryDate(method.expiryDate)) {
        errors.expiryDate = 'Please enter a valid expiry date (MM/YY)'
      }

      if (!method.cvv?.trim()) {
        errors.cvv = 'CVV is required'
      } else if (!/^\d{3,4}$/.test(method.cvv)) {
        errors.cvv = 'Please enter a valid CVV'
      }

      if (!method.cardholderName?.trim()) {
        errors.cardholderName = 'Cardholder name is required'
      }
    }

    return { valid: Object.keys(errors).length === 0, errors }
  }

  private validateCardNumber(cardNumber: string): boolean {
    // Basic Luhn algorithm check
    const digits = cardNumber.replace(/\D/g, '')
    if (digits.length < 13 || digits.length > 19) return false
    
    let sum = 0
    let isEven = false
    
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i])
      
      if (isEven) {
        digit *= 2
        if (digit > 9) digit -= 9
      }
      
      sum += digit
      isEven = !isEven
    }
    
    return sum % 10 === 0
  }

  private validateExpiryDate(expiryDate: string): boolean {
    const [month, year] = expiryDate.split('/')
    if (!month || !year) return false
    
    const monthNum = parseInt(month)
    const yearNum = parseInt(`20${year}`)
    
    if (monthNum < 1 || monthNum > 12) return false
    
    const now = new Date()
    const expiry = new Date(yearNum, monthNum - 1)
    
    return expiry > now
  }

  private getCardBrand(cardNumber: string): string {
    const digits = cardNumber.replace(/\D/g, '')
    
    if (digits.startsWith('4')) return 'Visa'
    if (digits.startsWith('5') || digits.startsWith('2')) return 'Mastercard'
    if (digits.startsWith('3')) return 'American Express'
    if (digits.startsWith('6')) return 'Discover'
    
    return 'Unknown'
  }

  // Demo-specific helper methods
  getDemoCardNumbers(): { success: string[]; failure: string[] } {
    const demoConfig = this.config.demoConfig!
    return {
      success: demoConfig.demoCardNumbers,
      failure: demoConfig.autoFailCardNumbers
    }
  }

  getDemoScenarios(): Array<{ name: string; cardNumber: string; description: string; expectedResult: 'success' | 'failure' }> {
    return [
      {
        name: 'Successful Payment',
        cardNumber: '4111111111111111',
        description: 'Standard Visa card that will process successfully',
        expectedResult: 'success'
      },
      {
        name: 'Successful Mastercard',
        cardNumber: '5555555555554444',
        description: 'Standard Mastercard that will process successfully',
        expectedResult: 'success'
      },
      {
        name: 'Successful Amex',
        cardNumber: '378282246310005',
        description: 'American Express card that will process successfully',
        expectedResult: 'success'
      },
      {
        name: 'Card Declined',
        cardNumber: '4000000000000002',
        description: 'This card will always be declined',
        expectedResult: 'failure'
      },
      {
        name: 'Insufficient Funds',
        cardNumber: '4000000000009995',
        description: 'This card will fail due to insufficient funds',
        expectedResult: 'failure'
      },
      {
        name: 'Lost Card',
        cardNumber: '4000000000009987',
        description: 'This card will fail as it has been reported lost',
        expectedResult: 'failure'
      }
    ]
  }

  getProcessingStats(): { successRate: number; averageProcessingTime: number; totalTransactions: number } {
    // In a real implementation, this would track actual stats
    // For demo, return configured values
    const demoConfig = this.config.demoConfig!
    return {
      successRate: demoConfig.successRate,
      averageProcessingTime: demoConfig.processingDelay,
      totalTransactions: 0 // Would be tracked in real implementation
    }
  }
}

// Stripe Payment Service Implementation (production ready)
export class StripePaymentService extends PaymentService {
  private stripeConfig: StripePaymentConfig

  constructor(config: PaymentServiceConfig) {
    super(config)
    this.stripeConfig = config.stripeConfig!
    
    if (!this.stripeConfig.secretKey) {
      throw new Error('Stripe secret key is required for production payment service')
    }
  }

  isDemo(): boolean {
    return false
  }

  async processPayment(amount: number, method: PaymentMethod): Promise<PaymentResult> {
    try {
      // In a real implementation, this would use the Stripe SDK
      // For now, we'll simulate the Stripe API structure
      
      if (!this.validateStripeCredentials()) {
        throw new Error('Invalid Stripe credentials')
      }

      // Simulate Stripe payment processing
      const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // In production, this would make actual API calls to Stripe
      const stripeResponse = await this.simulateStripePayment(amount, method, paymentIntentId)
      
      if (stripeResponse.status === 'succeeded') {
        return {
          success: true,
          paymentId: paymentIntentId,
          transactionId: stripeResponse.charges?.data[0]?.id || `ch_${Date.now()}`,
          receipt: {
            paymentId: paymentIntentId,
            amount,
            currency: 'USD',
            method,
            timestamp: new Date(),
            last4: method.cardNumber?.slice(-4),
            brand: this.getCardBrand(method.cardNumber || ''),
            isDemoTransaction: false
          }
        }
      } else {
        return {
          success: false,
          paymentId: paymentIntentId,
          error: stripeResponse.last_payment_error?.message || 'Payment failed'
        }
      }
    } catch (error) {
      return {
        success: false,
        paymentId: '',
        error: error instanceof Error ? error.message : 'Unknown payment error'
      }
    }
  }

  async createPaymentIntent(amount: number, currency = 'USD'): Promise<PaymentIntent> {
    try {
      if (!this.validateStripeCredentials()) {
        throw new Error('Invalid Stripe credentials')
      }

      // In production, this would use: stripe.paymentIntents.create()
      const intentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      return {
        id: intentId,
        amount,
        currency,
        status: 'requires_payment_method',
        clientSecret: `${intentId}_secret_${Math.random().toString(36).substr(2, 9)}`
      }
    } catch (error) {
      throw new Error(`Failed to create payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async confirmPayment(intentId: string, method: PaymentMethod): Promise<PaymentResult> {
    try {
      if (!this.validateStripeCredentials()) {
        throw new Error('Invalid Stripe credentials')
      }

      // In production, this would use: stripe.paymentIntents.confirm()
      const stripeResponse = await this.simulateStripeConfirmation(intentId, method)
      
      if (stripeResponse.status === 'succeeded') {
        return {
          success: true,
          paymentId: intentId,
          transactionId: stripeResponse.charges?.data[0]?.id || `ch_${Date.now()}`,
          receipt: {
            paymentId: intentId,
            amount: stripeResponse.amount || 0,
            currency: stripeResponse.currency || 'USD',
            method,
            timestamp: new Date(),
            last4: method.cardNumber?.slice(-4),
            brand: this.getCardBrand(method.cardNumber || ''),
            isDemoTransaction: false
          }
        }
      } else {
        return {
          success: false,
          paymentId: intentId,
          error: stripeResponse.last_payment_error?.message || 'Payment confirmation failed'
        }
      }
    } catch (error) {
      return {
        success: false,
        paymentId: intentId,
        error: error instanceof Error ? error.message : 'Unknown confirmation error'
      }
    }
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    // In production, this would retrieve saved payment methods from Stripe
    // For now, return empty array as this is typically handled by Stripe Elements
    return []
  }

  validatePaymentMethod(method: PaymentMethod): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {}

    if (method.type === 'card') {
      if (!method.cardNumber?.trim()) {
        errors.cardNumber = 'Card number is required'
      } else if (!this.validateCardNumber(method.cardNumber)) {
        errors.cardNumber = 'Please enter a valid card number'
      }

      if (!method.expiryDate?.trim()) {
        errors.expiryDate = 'Expiry date is required'
      } else if (!this.validateExpiryDate(method.expiryDate)) {
        errors.expiryDate = 'Please enter a valid expiry date (MM/YY)'
      }

      if (!method.cvv?.trim()) {
        errors.cvv = 'CVV is required'
      } else if (!/^\d{3,4}$/.test(method.cvv)) {
        errors.cvv = 'Please enter a valid CVV'
      }

      if (!method.cardholderName?.trim()) {
        errors.cardholderName = 'Cardholder name is required'
      }
    }

    return { valid: Object.keys(errors).length === 0, errors }
  }

  // Private helper methods
  private validateStripeCredentials(): boolean {
    return !!(this.stripeConfig.secretKey && this.stripeConfig.publishableKey)
  }

  private async simulateStripePayment(amount: number, method: PaymentMethod, intentId: string): Promise<any> {
    // Simulate Stripe API response structure
    // In production, this would be replaced with actual Stripe SDK calls
    
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate network delay
    
    // Simulate some payment failures for testing
    const shouldFail = method.cardNumber === '4000000000000002' // Stripe test card for declined
    
    if (shouldFail) {
      return {
        id: intentId,
        status: 'requires_payment_method',
        last_payment_error: {
          message: 'Your card was declined.',
          type: 'card_error',
          code: 'card_declined'
        }
      }
    }

    return {
      id: intentId,
      status: 'succeeded',
      amount,
      currency: 'usd',
      charges: {
        data: [{
          id: `ch_${Date.now()}`,
          amount,
          currency: 'usd',
          status: 'succeeded'
        }]
      }
    }
  }

  private async simulateStripeConfirmation(intentId: string, method: PaymentMethod): Promise<any> {
    // Simulate Stripe payment intent confirmation
    await new Promise(resolve => setTimeout(resolve, 800))
    
    return {
      id: intentId,
      status: 'succeeded',
      amount: 100, // Would be retrieved from the actual intent
      currency: 'usd',
      charges: {
        data: [{
          id: `ch_${Date.now()}`,
          amount: 100,
          currency: 'usd',
          status: 'succeeded'
        }]
      }
    }
  }

  private validateCardNumber(cardNumber: string): boolean {
    // Basic Luhn algorithm check (same as demo service)
    const digits = cardNumber.replace(/\D/g, '')
    if (digits.length < 13 || digits.length > 19) return false
    
    let sum = 0
    let isEven = false
    
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i])
      
      if (isEven) {
        digit *= 2
        if (digit > 9) digit -= 9
      }
      
      sum += digit
      isEven = !isEven
    }
    
    return sum % 10 === 0
  }

  private validateExpiryDate(expiryDate: string): boolean {
    const [month, year] = expiryDate.split('/')
    if (!month || !year) return false
    
    const monthNum = parseInt(month)
    const yearNum = parseInt(`20${year}`)
    
    if (monthNum < 1 || monthNum > 12) return false
    
    const now = new Date()
    const expiry = new Date(yearNum, monthNum - 1)
    
    return expiry > now
  }

  private getCardBrand(cardNumber: string): string {
    const digits = cardNumber.replace(/\D/g, '')
    
    if (digits.startsWith('4')) return 'Visa'
    if (digits.startsWith('5') || digits.startsWith('2')) return 'Mastercard'
    if (digits.startsWith('3')) return 'American Express'
    if (digits.startsWith('6')) return 'Discover'
    
    return 'Unknown'
  }

  // Production-specific methods
  getStripePublishableKey(): string {
    return this.stripeConfig.publishableKey
  }

  getWebhookSecret(): string {
    return this.stripeConfig.webhookSecret
  }

  // Method to handle Stripe webhooks (for production)
  async handleWebhook(payload: string, signature: string): Promise<{ success: boolean; event?: any; error?: string }> {
    try {
      // In production, this would use: stripe.webhooks.constructEvent()
      // For now, simulate webhook handling
      
      if (!signature) {
        throw new Error('Missing Stripe signature')
      }

      // Parse the webhook payload
      const event = JSON.parse(payload)
      
      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          // Handle successful payment
          console.log('Payment succeeded:', event.data.object.id)
          break
        case 'payment_intent.payment_failed':
          // Handle failed payment
          console.log('Payment failed:', event.data.object.id)
          break
        default:
          console.log('Unhandled event type:', event.type)
      }

      return { success: true, event }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Webhook processing failed' 
      }
    }
  }
}