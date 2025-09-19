// Mock fetch for API testing
global.fetch = jest.fn()

// Mock environment variables for demo mode
process.env.PAYMENT_MODE = 'demo'
process.env.CMS_MODE = 'demo'

describe('Demo API Integration Tests', () => {
  const testUserId = 'test-user-1'
  const baseUrl = 'http://localhost:3000'

  beforeEach(() => {
    // Reset fetch mock
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('Payment API in Demo Mode', () => {
    test('should process demo payment successfully', async () => {
      const paymentData = {
        amount: 299.99,
        currency: 'USD',
        paymentMethod: {
          type: 'card',
          cardNumber: '4111111111111111',
          expiryDate: '12/25',
          cvv: '123',
          cardholderName: 'Demo User'
        },
        orderData: {
          userId: testUserId,
          items: [
            { productId: 'desk-1', quantity: 1, price: 299.99 }
          ],
          shippingAddress: {
            street: '123 Demo Street',
            city: 'Demo City',
            state: 'DC',
            zipCode: '12345',
            country: 'US'
          },
          billingAddress: {
            street: '123 Demo Street',
            city: 'Demo City',
            state: 'DC',
            zipCode: '12345',
            country: 'US'
          }
        }
      }

      // Mock successful payment response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          paymentId: 'demo_123456789',
          receipt: {
            paymentId: 'demo_123456789',
            amount: 299.99,
            currency: 'USD',
            timestamp: new Date(),
            last4: '1111',
            brand: 'Visa',
            isDemoTransaction: true
          },
          order: {
            id: 'order_987654321',
            status: 'CONFIRMED',
            total: 299.99
          }
        })
      })

      const response = await fetch(`${baseUrl}/api/payment/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      })

      const result = await response.json()

      expect(response.ok).toBe(true)
      expect(result.success).toBe(true)
      expect(result.paymentId).toMatch(/^demo_/)
      expect(result.receipt).toBeDefined()
      expect(result.receipt.isDemoTransaction).toBe(true)
      expect(result.order).toBeDefined()
      expect(result.order.id).toBeDefined()
    })

    test('should handle demo payment failure', async () => {
      const paymentData = {
        amount: 299.99,
        currency: 'USD',
        paymentMethod: {
          type: 'card',
          cardNumber: '4000000000000002', // Declined card
          expiryDate: '12/25',
          cvv: '123',
          cardholderName: 'Demo User'
        },
        orderData: {
          userId: testUserId,
          items: [
            { productId: 'desk-1', quantity: 1, price: 299.99 }
          ],
          shippingAddress: {
            street: '123 Demo Street',
            city: 'Demo City',
            state: 'DC',
            zipCode: '12345',
            country: 'US'
          },
          billingAddress: {
            street: '123 Demo Street',
            city: 'Demo City',
            state: 'DC',
            zipCode: '12345',
            country: 'US'
          }
        }
      }

      // Mock payment failure response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Your card was declined. Please try a different payment method.'
        })
      })

      const response = await fetch(`${baseUrl}/api/payment/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      })

      const result = await response.json()

      expect(response.ok).toBe(false)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('declined')
    })

    test('should validate payment data', async () => {
      const invalidPaymentData = {
        amount: -100, // Invalid amount
        currency: 'USD',
        paymentMethod: {
          type: 'card',
          cardNumber: '1234', // Invalid card number
          expiryDate: '13/20', // Invalid expiry
          cvv: '12', // Invalid CVV
          cardholderName: ''
        }
      }

      // Mock validation error response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Invalid payment data provided'
        })
      })

      const response = await fetch(`${baseUrl}/api/payment/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidPaymentData)
      })

      const result = await response.json()

      expect(response.ok).toBe(false)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Orders API', () => {
    const testOrderId = 'order-123'

    beforeEach(() => {
      // Reset fetch mock for each test
      ;(global.fetch as jest.Mock).mockClear()
    })

    test('should get user orders', async () => {
      // Mock orders response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          orders: [
            {
              id: testOrderId,
              userId: testUserId,
              total: 599.99,
              status: 'CONFIRMED',
              createdAt: '2024-01-15T10:30:00Z',
              items: [
                {
                  id: 'item-1',
                  productId: 'desk-1',
                  name: 'Test Desk',
                  price: 599.99,
                  quantity: 1,
                  image: '/test-desk.jpg'
                }
              ]
            }
          ],
          pagination: {
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1
          }
        })
      })

      const response = await fetch(`${baseUrl}/api/orders?userId=${testUserId}`)
      const result = await response.json()

      expect(response.ok).toBe(true)
      expect(result.orders).toHaveLength(1)
      expect(result.orders[0].id).toBe(testOrderId)
      expect(result.orders[0].total).toBe(599.99)
    })

    test('should get order by id', async () => {
      // Mock order details response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          order: {
            id: testOrderId,
            userId: testUserId,
            total: 599.99,
            status: 'CONFIRMED',
            items: [
              {
                id: 'item-1',
                productId: 'desk-1',
                name: 'Test Desk',
                price: 599.99,
                quantity: 1,
                image: '/test-desk.jpg'
              }
            ]
          }
        })
      })

      const response = await fetch(`${baseUrl}/api/orders/${testOrderId}`)
      const result = await response.json()

      expect(response.ok).toBe(true)
      expect(result.order.id).toBe(testOrderId)
      expect(result.order.items).toHaveLength(1)
      expect(result.order.items[0].productId).toBe('desk-1')
    })

    test('should cancel order', async () => {
      // Mock order cancellation response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Order cancelled successfully'
        })
      })

      const response = await fetch(`${baseUrl}/api/orders/${testOrderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: testUserId })
      })

      const result = await response.json()

      expect(response.ok).toBe(true)
      expect(result.success).toBe(true)
    })

    test('should filter orders by status', async () => {
      // Mock filtered orders response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          orders: [
            {
              id: 'order-processing',
              userId: testUserId,
              total: 299.99,
              status: 'PROCESSING',
              createdAt: '2024-01-14T15:20:00Z'
            }
          ],
          pagination: {
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1
          }
        })
      })

      const response = await fetch(`${baseUrl}/api/orders?userId=${testUserId}&status=PROCESSING`)
      const result = await response.json()

      expect(response.ok).toBe(true)
      expect(result.orders).toHaveLength(1)
      expect(result.orders[0].status).toBe('PROCESSING')
    })

    test('should paginate orders', async () => {
      // Mock paginated orders response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          orders: Array.from({ length: 10 }, (_, i) => ({
            id: `order-${i}`,
            userId: testUserId,
            total: 100 + i,
            status: 'CONFIRMED',
            createdAt: '2024-01-15T10:30:00Z'
          })),
          pagination: {
            total: 15,
            page: 1,
            limit: 10,
            totalPages: 2
          }
        })
      })

      const response = await fetch(`${baseUrl}/api/orders?userId=${testUserId}&page=1&limit=10`)
      const result = await response.json()

      expect(response.ok).toBe(true)
      expect(result.orders).toHaveLength(10)
      expect(result.pagination).toBeDefined()
      expect(result.pagination.total).toBe(15)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(10)
    })
  })

  describe('CMS API in Demo Mode', () => {
    test('should check CMS connection status', async () => {
      // Mock CMS connection status response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          connected: true,
          mode: 'demo',
          lastSync: '2024-01-15T10:30:00Z',
          status: 'healthy'
        })
      })

      const response = await fetch(`${baseUrl}/api/cms/connection`)
      const result = await response.json()

      expect(response.ok).toBe(true)
      expect(result.connected).toBe(true)
      expect(result.mode).toBe('demo')
      expect(result.lastSync).toBeDefined()
    })

    test('should sync products from CMS', async () => {
      // Mock CMS sync response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          productsUpdated: 5,
          errors: [],
          lastSync: '2024-01-15T10:30:00Z'
        })
      })

      const response = await fetch(`${baseUrl}/api/cms/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      expect(response.ok).toBe(true)
      expect(result.success).toBe(true)
      expect(result.productsUpdated).toBeGreaterThanOrEqual(0)
      expect(result.errors).toBeDefined()
      expect(Array.isArray(result.errors)).toBe(true)
    })

    test('should handle CMS sync with fallback', async () => {
      // Mock CMS sync with fallback response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          productsUpdated: 3,
          errors: [],
          fallbackUsed: true,
          lastSync: '2024-01-15T10:30:00Z'
        })
      })

      const response = await fetch(`${baseUrl}/api/cms/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      expect(response.ok).toBe(true)
      expect(result.success).toBe(true)
      expect(result.fallbackUsed).toBe(true)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('should handle malformed JSON requests', async () => {
      // Mock malformed JSON error response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Invalid JSON format in request body'
        })
      })

      const response = await fetch(`${baseUrl}/api/payment/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: 'invalid json'
      })

      const result = await response.json()

      expect(response.ok).toBe(false)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid JSON')
    })

    test('should handle missing required fields', async () => {
      // Mock missing fields error response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Missing required fields: paymentMethod, orderData'
        })
      })

      const incompleteData = {
        amount: 100
        // Missing other required fields
      }

      const response = await fetch(`${baseUrl}/api/payment/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(incompleteData)
      })

      const result = await response.json()

      expect(response.ok).toBe(false)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    test('should handle non-existent order requests', async () => {
      // Mock order not found response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: 'Order not found'
        })
      })

      const response = await fetch(`${baseUrl}/api/orders/non-existent-id`)
      const result = await response.json()

      expect(response.ok).toBe(false)
      expect(result.error).toBe('Order not found')
    })

    test('should handle unauthorized order access', async () => {
      // Mock unauthorized access response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'Unauthorized'
        })
      })

      const response = await fetch(`${baseUrl}/api/orders/other-user-order?userId=${testUserId}`)
      const result = await response.json()

      expect(response.ok).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })
  })
})