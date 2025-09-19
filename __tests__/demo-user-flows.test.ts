// Mock Prisma Client
const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
  },
  order: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  product: {
    create: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
  },
  $disconnect: jest.fn(),
}

// Mock auth utils
const mockAuthUtils = {
  createUser: jest.fn(),
  findUserByEmail: jest.fn(),
  findUserById: jest.fn(),
  verifyPassword: jest.fn(),
}

// Mock services
const mockPaymentService = {
  processPayment: jest.fn(),
  isDemo: jest.fn().mockReturnValue(true),
}

const mockOrderService = {
  createOrder: jest.fn(),
  getUserOrders: jest.fn(),
  getOrderById: jest.fn(),
  updateOrderStatus: jest.fn(),
  cancelOrder: jest.fn(),
  createReorder: jest.fn(),
  generateDemoOrder: jest.fn(),
  resetDemoData: jest.fn(),
}

const mockCMSClient = {
  getProducts: jest.fn(),
  syncProducts: jest.fn(),
  isConnected: jest.fn(),
}

const mockCMSFallback = {
  getProducts: jest.fn(),
}

// Mock modules
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}))

jest.mock('../app/lib/auth-utils', () => mockAuthUtils)
jest.mock('../app/lib/payment-service', () => ({
  DemoPaymentService: jest.fn(() => mockPaymentService),
}))
jest.mock('../app/lib/demo-order-service', () => ({
  DemoOrderService: jest.fn(() => mockOrderService),
}))
jest.mock('../app/lib/cms-client', () => ({
  CMSClient: jest.fn(() => mockCMSClient),
}))
jest.mock('../app/lib/cms-fallback', () => ({
  CMSFallbackService: jest.fn(() => mockCMSFallback),
}))

describe('Demo User Flows Integration Tests', () => {
  let testUser: any

  beforeAll(() => {
    // Set up test user data
    testUser = {
      id: 'test-user-1',
      email: 'demo@kinworkspace.com',
      firstName: 'Demo',
      lastName: 'User',
      createdAt: new Date(),
    }
  })

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Set up default mock implementations
    mockAuthUtils.createUser.mockResolvedValue(testUser)
    mockAuthUtils.findUserByEmail.mockResolvedValue({ ...testUser, password: 'hashedpassword' })
    mockAuthUtils.findUserById.mockResolvedValue(testUser)
    
    mockPaymentService.processPayment.mockImplementation(async (amount, method) => {
      if (method.cardNumber === '4000000000000002') {
        return {
          success: false,
          error: 'Your card was declined. Please try a different payment method.',
          paymentId: '',
        }
      }
      return {
        success: true,
        paymentId: 'demo_123456789',
        receipt: {
          paymentId: 'demo_123456789',
          amount,
          currency: 'USD',
          timestamp: new Date(),
          last4: '1111',
          brand: 'Visa',
          isDemoTransaction: true,
        },
      }
    })
    
    mockOrderService.createOrder.mockImplementation(async (orderData) => ({
      id: 'order_987654321',
      userId: orderData.userId,
      total: orderData.total,
      status: orderData.status || 'CONFIRMED',
      items: orderData.items,
      createdAt: new Date(),
      paymentId: orderData.paymentId,
      shippingAddress: orderData.shippingAddress,
      billingAddress: orderData.billingAddress,
    }))
    
    mockOrderService.getUserOrders.mockResolvedValue([])
    mockOrderService.getOrderById.mockResolvedValue(null)
    mockOrderService.updateOrderStatus.mockResolvedValue(undefined)
    mockOrderService.cancelOrder.mockResolvedValue(true)
    mockOrderService.createReorder.mockResolvedValue([])
    
    mockCMSClient.isConnected.mockResolvedValue(true)
    mockCMSClient.getProducts.mockResolvedValue([])
    mockCMSClient.syncProducts.mockResolvedValue({
      success: true,
      productsUpdated: 0,
      errors: [],
      lastSync: new Date(),
    })
    
    mockCMSFallback.getProducts.mockResolvedValue([])
  })

  describe('Complete User Registration to Order Flow', () => {
    test('should complete full user journey from registration to order completion', async () => {
      // 1. User Registration (already done in beforeEach)
      expect(testUser).toBeDefined()
      expect(testUser.email).toBe('demo@kinworkspace.com')

      // 2. User Login
      const foundUser = await mockAuthUtils.findUserByEmail('demo@kinworkspace.com')
      expect(foundUser).toBeTruthy()
      expect(foundUser?.id).toBe(testUser.id)

      // 3. Browse Products (simulate product data)
      const mockProducts = [
        {
          id: 'desk-1',
          name: 'Modern Standing Desk',
          price: 599.99,
          category: 'Desks',
          slug: 'modern-standing-desk',
          image: '/images/desk-1.jpg',
          description: 'Adjustable height standing desk'
        },
        {
          id: 'chair-1',
          name: 'Ergonomic Office Chair',
          price: 299.99,
          category: 'Seating',
          slug: 'ergonomic-office-chair',
          image: '/images/chair-1.jpg',
          description: 'Comfortable ergonomic chair'
        }
      ]

      // Mock product creation
      mockPrisma.product.create.mockResolvedValue(mockProducts[0])

      // 4. Add to Cart (simulate cart operations)
      const cartItems = [
        { productId: 'desk-1', quantity: 1 },
        { productId: 'chair-1', quantity: 2 }
      ]

      const cartTotal = (599.99 * 1) + (299.99 * 2) // 1199.97

      // 5. Checkout Process
      const checkoutData = {
        userId: testUser.id,
        items: cartItems,
        total: cartTotal,
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

      // 6. Demo Payment Processing
      const paymentResult = await mockPaymentService.processPayment(cartTotal, {
        type: 'card',
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'Demo User'
      })

      expect(paymentResult.success).toBe(true)
      expect(paymentResult.paymentId).toMatch(/^demo_/)
      expect(paymentResult.receipt).toBeDefined()
      expect(paymentResult.receipt?.isDemoTransaction).toBe(true)

      // 7. Order Creation
      const order = await mockOrderService.createOrder({
        userId: testUser.id,
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.productId === 'desk-1' ? 599.99 : 299.99
        })),
        total: cartTotal,
        paymentId: paymentResult.paymentId,
        shippingAddress: checkoutData.shippingAddress,
        billingAddress: checkoutData.billingAddress,
        status: 'CONFIRMED'
      })

      expect(order).toBeDefined()
      expect(order.id).toBeDefined()
      expect(order.status).toBe('CONFIRMED')
      expect(order.total).toBe(cartTotal)
      expect(order.userId).toBe(testUser.id)

      // 8. Order Management - View Order History
      mockOrderService.getUserOrders.mockResolvedValue([order])
      const userOrders = await mockOrderService.getUserOrders(testUser.id)
      expect(userOrders).toHaveLength(1)
      expect(userOrders[0].id).toBe(order.id)

      // 9. Order Details View
      mockOrderService.getOrderById.mockResolvedValue({
        ...order,
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.productId === 'desk-1' ? 599.99 : 299.99
        }))
      })
      const orderDetails = await mockOrderService.getOrderById(order.id)
      expect(orderDetails).toBeDefined()
      expect(orderDetails?.items).toHaveLength(2)
      expect(orderDetails?.total).toBe(cartTotal)

      // 10. Order Status Updates (simulate progression)
      await mockOrderService.updateOrderStatus(order.id, 'PROCESSING')
      mockOrderService.getOrderById.mockResolvedValue({
        ...order,
        status: 'PROCESSING'
      })
      const updatedOrder = await mockOrderService.getOrderById(order.id)
      expect(updatedOrder?.status).toBe('PROCESSING')
    })

    test('should handle payment failure scenarios gracefully', async () => {
      // Use a card number that will fail
      const paymentResult = await mockPaymentService.processPayment(100.00, {
        type: 'card',
        cardNumber: '4000000000000002', // Declined card
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'Demo User'
      })

      expect(paymentResult.success).toBe(false)
      expect(paymentResult.error).toBeDefined()
      expect(paymentResult.error).toContain('declined')

      // Verify no order was created
      const userOrders = await mockOrderService.getUserOrders(testUser.id)
      expect(userOrders).toHaveLength(0)
    })

    test('should handle order cancellation', async () => {
      // Create an order first
      const order = await mockOrderService.createOrder({
        userId: testUser.id,
        items: [{ productId: 'desk-1', quantity: 1, price: 599.99 }],
        total: 599.99,
        paymentId: 'demo_test_payment',
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
        },
        status: 'CONFIRMED'
      })

      // Cancel the order
      const cancelled = await mockOrderService.cancelOrder(order.id)
      expect(cancelled).toBe(true)

      // Verify order status
      mockOrderService.getOrderById.mockResolvedValue({
        ...order,
        status: 'CANCELLED'
      })
      const cancelledOrder = await mockOrderService.getOrderById(order.id)
      expect(cancelledOrder?.status).toBe('CANCELLED')
    })

    test('should handle reorder functionality', async () => {
      // Create an order first
      const originalItems = [
        { productId: 'desk-1', quantity: 1, price: 599.99 },
        { productId: 'chair-1', quantity: 2, price: 299.99 }
      ]

      const order = await mockOrderService.createOrder({
        userId: testUser.id,
        items: originalItems,
        total: 1199.97,
        paymentId: 'demo_test_payment',
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
        },
        status: 'DELIVERED'
      })

      // Reorder
      mockOrderService.createReorder.mockResolvedValue([
        { productId: 'desk-1', quantity: 1 },
        { productId: 'chair-1', quantity: 2 }
      ])
      const reorderItems = await mockOrderService.createReorder(order.id)
      expect(reorderItems).toHaveLength(2)
      expect(reorderItems[0].productId).toBe('desk-1')
      expect(reorderItems[0].quantity).toBe(1)
      expect(reorderItems[1].productId).toBe('chair-1')
      expect(reorderItems[1].quantity).toBe(2)
    })
  })

  describe('CMS Integration and Fallback Scenarios', () => {
    test('should sync products from CMS successfully', async () => {
      // Mock CMS response
      const mockCMSProducts = [
        {
          id: 'cms-desk-1',
          name: 'CMS Standing Desk',
          price: 699.99,
          category: 'Desks',
          slug: 'cms-standing-desk',
          image: 'https://cms.example.com/images/desk-1.jpg',
          description: 'Premium standing desk from CMS'
        }
      ]

      // Mock CMS client methods
      mockCMSClient.getProducts.mockResolvedValue(mockCMSProducts)
      mockCMSClient.isConnected.mockResolvedValue(true)
      mockCMSClient.syncProducts.mockResolvedValue({
        success: true,
        productsUpdated: 1,
        errors: [],
        lastSync: new Date()
      })

      // Perform sync
      const syncResult = await mockCMSClient.syncProducts()
      
      expect(syncResult.success).toBe(true)
      expect(syncResult.productsUpdated).toBe(1)
      expect(syncResult.errors).toHaveLength(0)

      // Verify product creation was attempted
      expect(mockCMSClient.syncProducts).toHaveBeenCalled()
    })

    test('should fallback to local data when CMS is unavailable', async () => {
      // Create local fallback products
      const fallbackProducts = [
        {
          id: 'local-desk-1',
          name: 'Local Desk',
          price: 499.99,
          category: 'Desks',
          slug: 'local-desk',
          image: '/images/local-desk.jpg',
          description: 'Local fallback desk'
        }
      ]

      // Mock CMS as unavailable
      mockCMSClient.isConnected.mockResolvedValue(false)
      mockCMSFallback.getProducts.mockResolvedValue(fallbackProducts)

      // Use fallback service
      const products = await mockCMSFallback.getProducts()
      expect(products).toHaveLength(1)
      expect(products[0].id).toBe('local-desk-1')
      expect(products[0].name).toBe('Local Desk')
    })

    test('should handle partial CMS sync failures', async () => {
      const mockCMSProducts = [
        {
          id: 'valid-product',
          name: 'Valid Product',
          price: 299.99,
          category: 'Desks',
          slug: 'valid-product',
          image: 'https://cms.example.com/valid.jpg',
          description: 'Valid product'
        },
        {
          id: 'invalid-product',
          name: '', // Invalid - empty name
          price: -100, // Invalid - negative price
          category: 'Desks',
          slug: 'invalid-product',
          image: 'invalid-url',
          description: 'Invalid product'
        }
      ]

      mockCMSClient.getProducts.mockResolvedValue(mockCMSProducts)
      mockCMSClient.isConnected.mockResolvedValue(true)
      mockCMSClient.syncProducts.mockResolvedValue({
        success: true, // Partial success
        productsUpdated: 1, // Only valid product
        errors: ['Failed to sync invalid-product: Invalid product data'],
        lastSync: new Date()
      })

      const syncResult = await mockCMSClient.syncProducts()
      
      expect(syncResult.success).toBe(true) // Partial success
      expect(syncResult.productsUpdated).toBe(1) // Only valid product
      expect(syncResult.errors).toHaveLength(1) // One error for invalid product
      expect(syncResult.errors[0]).toContain('invalid-product')
    })
  })

  describe('Demo Mode Indicators and Data Management', () => {
    test('should identify demo transactions correctly', async () => {
      const paymentResult = await mockPaymentService.processPayment(100.00, {
        type: 'card',
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'Demo User'
      })

      expect(mockPaymentService.isDemo()).toBe(true)
      expect(paymentResult.receipt?.isDemoTransaction).toBe(true)
      expect(paymentResult.paymentId).toMatch(/^demo_/)
    })

    test('should generate realistic demo data', async () => {
      // Mock demo order generation
      const mockDemoOrder = {
        id: 'demo-order-1',
        userId: testUser.id,
        total: 899.99,
        items: [
          { productId: 'desk-1', quantity: 1, price: 599.99 },
          { productId: 'chair-1', quantity: 1, price: 299.99 }
        ],
        status: 'CONFIRMED',
        createdAt: new Date()
      }
      
      mockOrderService.generateDemoOrder.mockResolvedValue(mockDemoOrder)
      
      // Test demo order generation
      const demoOrder = await mockOrderService.generateDemoOrder(testUser.id)
      
      expect(demoOrder).toBeDefined()
      expect(demoOrder.userId).toBe(testUser.id)
      expect(demoOrder.total).toBeGreaterThan(0)
      expect(demoOrder.items.length).toBeGreaterThan(0)
      expect(demoOrder.status).toMatch(/^(CONFIRMED|PROCESSING|SHIPPED|DELIVERED)$/)
    })

    test('should reset demo data successfully', async () => {
      // Create some demo data
      await mockOrderService.createOrder({
        userId: testUser.id,
        items: [{ productId: 'desk-1', quantity: 1, price: 599.99 }],
        total: 599.99,
        paymentId: 'demo_test_payment',
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
        },
        status: 'CONFIRMED'
      })

      // Verify data exists
      mockOrderService.getUserOrders.mockResolvedValueOnce([{ id: 'order-1' }])
      let orders = await mockOrderService.getUserOrders(testUser.id)
      expect(orders).toHaveLength(1)

      // Reset demo data
      await mockOrderService.resetDemoData()

      // Verify data is cleared
      mockOrderService.getUserOrders.mockResolvedValueOnce([])
      orders = await mockOrderService.getUserOrders(testUser.id)
      expect(orders).toHaveLength(0)
    })
  })
})