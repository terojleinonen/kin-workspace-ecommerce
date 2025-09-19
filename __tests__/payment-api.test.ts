import { NextRequest } from 'next/server'
import { POST, GET } from '../app/api/payment/process/route'
import { PaymentServiceFactory } from '../app/lib/payment-service'
import { generateToken } from '../app/lib/auth-utils'

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    order: {
      create: jest.fn().mockResolvedValue({
        id: 'order-123',
        status: 'CONFIRMED',
        total: 100,
        createdAt: new Date(),
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            quantity: 1,
            price: 100,
            product: {
              name: 'Test Product'
            }
          }
        ]
      })
    },
    $disconnect: jest.fn()
  }))
}))

// Mock auth utils
jest.mock('../app/lib/auth-utils', () => ({
  verifyToken: jest.fn(),
  generateToken: jest.fn()
}))

describe('Payment API', () => {
  beforeEach(() => {
    // Reset payment service factory
    PaymentServiceFactory.resetInstance()
    jest.clearAllMocks()
  })

  describe('POST /api/payment/process', () => {
    const validPaymentData = {
      amount: 100,
      paymentMethod: {
        type: 'card',
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'Test User'
      },
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'US'
      },
      billingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'US',
        sameAsShipping: true
      },
      cartItems: [
        {
          productId: 'product-1',
          quantity: 1,
          price: 100
        }
      ],
      orderSummary: {
        subtotal: 100,
        shipping: 0,
        tax: 8,
        discount: 0,
        total: 108
      }
    }

    test('should process payment successfully with valid auth', async () => {
      // Mock successful auth
      const mockVerifyToken = require('../app/lib/auth-utils').verifyToken as jest.Mock
      mockVerifyToken.mockReturnValue({ userId: 'user-123' })

      const request = new NextRequest('http://localhost:3000/api/payment/process', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(validPaymentData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.paymentId).toBeDefined()
      expect(data.orderId).toBe('order-123')
      expect(data.isDemoTransaction).toBe(true)
      expect(data.receipt).toBeDefined()
    })

    test('should reject request without auth token', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment/process', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(validPaymentData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    test('should reject request with invalid token', async () => {
      // Mock invalid auth
      const mockVerifyToken = require('../app/lib/auth-utils').verifyToken as jest.Mock
      mockVerifyToken.mockReturnValue(null)

      const request = new NextRequest('http://localhost:3000/api/payment/process', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer invalid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(validPaymentData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid token')
    })

    test('should reject request with missing required fields', async () => {
      // Mock successful auth
      const mockVerifyToken = require('../app/lib/auth-utils').verifyToken as jest.Mock
      mockVerifyToken.mockReturnValue({ userId: 'user-123' })

      const incompleteData = { ...validPaymentData, paymentMethod: undefined as any }

      const request = new NextRequest('http://localhost:3000/api/payment/process', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(incompleteData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields')
    })

    test('should reject request with empty cart', async () => {
      // Mock successful auth
      const mockVerifyToken = require('../app/lib/auth-utils').verifyToken as jest.Mock
      mockVerifyToken.mockReturnValue({ userId: 'user-123' })

      const emptyCartData = { ...validPaymentData, cartItems: [] }

      const request = new NextRequest('http://localhost:3000/api/payment/process', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(emptyCartData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Cart cannot be empty')
    })

    test('should reject request with invalid payment method', async () => {
      // Mock successful auth
      const mockVerifyToken = require('../app/lib/auth-utils').verifyToken as jest.Mock
      mockVerifyToken.mockReturnValue({ userId: 'user-123' })

      const invalidPaymentData = {
        ...validPaymentData,
        paymentMethod: {
          type: 'card',
          cardNumber: '1234', // Invalid card number
          expiryDate: '12/25',
          cvv: '123',
          cardholderName: 'Test User'
        }
      }

      const request = new NextRequest('http://localhost:3000/api/payment/process', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(invalidPaymentData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid payment method')
      expect(data.details).toBeDefined()
    })

    test('should handle payment failure', async () => {
      // Mock successful auth
      const mockVerifyToken = require('../app/lib/auth-utils').verifyToken as jest.Mock
      mockVerifyToken.mockReturnValue({ userId: 'user-123' })

      // Use auto-fail card number
      const failingPaymentData = {
        ...validPaymentData,
        paymentMethod: {
          ...validPaymentData.paymentMethod,
          cardNumber: '4000000000000002' // Auto-fail card
        }
      }

      const request = new NextRequest('http://localhost:3000/api/payment/process', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(failingPaymentData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(402)
      expect(data.error).toBe('Payment failed')
      expect(data.message).toBeDefined()
      expect(data.paymentId).toBeDefined()
    })
  })

  describe('GET /api/payment/process', () => {
    test('should return payment info for demo mode', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment/process', {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isDemo).toBe(true)
      expect(data.supportedMethods).toContain('card')
      expect(data.demoInfo).toBeDefined()
      expect(data.demoInfo.scenarios).toBeDefined()
      expect(data.demoInfo.cardNumbers).toBeDefined()
      expect(data.demoInfo.processingStats).toBeDefined()
    })
  })
})