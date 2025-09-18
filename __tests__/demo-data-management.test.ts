import { generateDemoUsers, generateDemoOrders, generateDemoReviews } from '../app/lib/demo-data-generator'
import { getDemoUserAccounts, generateDemoOrderId, isDemoOrder } from '../app/lib/demo-utils'

describe('Demo Data Management', () => {
  describe('Demo Utils', () => {
    test('should generate demo order ID with correct format', () => {
      const orderId = generateDemoOrderId()
      
      expect(orderId).toMatch(/^DEMO-\d{6}-[A-Z0-9]{3}$/)
      expect(isDemoOrder(orderId)).toBe(true)
    })

    test('should identify demo orders correctly', () => {
      expect(isDemoOrder('DEMO-123456-ABC')).toBe(true)
      expect(isDemoOrder('ORDER-123456-ABC')).toBe(false)
      expect(isDemoOrder('regular-order-id')).toBe(false)
    })

    test('should return demo user accounts', () => {
      const accounts = getDemoUserAccounts()
      
      expect(accounts).toHaveLength(2)
      expect(accounts[0]).toHaveProperty('email', 'demo@kinworkspace.com')
      expect(accounts[0]).toHaveProperty('role', 'customer')
      expect(accounts[1]).toHaveProperty('email', 'admin@kinworkspace.com')
      expect(accounts[1]).toHaveProperty('role', 'admin')
    })
  })

  describe('Demo Data Generator', () => {
    test('should generate demo users with correct structure', async () => {
      const users = await generateDemoUsers(3)
      
      expect(users).toHaveLength(3)
      expect(users[0]).toHaveProperty('id', 'demo-user-1')
      expect(users[0]).toHaveProperty('email', 'demo@kinworkspace.com')
      expect(users[0]).toHaveProperty('name', 'Demo Customer')
      
      // Check that additional users have proper format
      users.slice(1).forEach((user, index) => {
        expect(user.id).toBe(`demo-user-${index + 2}`)
        expect(user.email).toMatch(/\.demo@kinworkspace\.com$/)
      })
    })

    test('should generate demo orders with valid structure', async () => {
      const userIds = ['demo-user-1', 'demo-user-2']
      const orders = await generateDemoOrders(userIds, 3)
      
      expect(orders).toHaveLength(3)
      
      orders.forEach(order => {
        expect(order.id).toMatch(/^DEMO-/)
        expect(userIds).toContain(order.userId)
        expect(order.total).toBeGreaterThan(0)
        expect(order.items).toBeDefined()
        expect(order.items.length).toBeGreaterThan(0)
        expect(typeof order.billingAddress).toBe('string')
        expect(typeof order.shippingAddress).toBe('string')
      })
    })

    test('should generate demo reviews with valid structure', async () => {
      const userIds = ['demo-user-1', 'demo-user-2']
      const reviews = await generateDemoReviews(userIds, 5)
      
      expect(reviews).toHaveLength(5)
      
      reviews.forEach(review => {
        expect(review.id).toMatch(/^demo-review-/)
        expect(userIds).toContain(review.userId)
        expect(review.rating).toBeGreaterThanOrEqual(1)
        expect(review.rating).toBeLessThanOrEqual(5)
        expect(review.title).toBeTruthy()
        expect(review.content).toBeTruthy()
        expect(typeof review.verified).toBe('boolean')
        expect(review.helpful).toBeGreaterThanOrEqual(0)
      })
    })

    test('should generate orders with realistic item counts and totals', async () => {
      const userIds = ['demo-user-1']
      const orders = await generateDemoOrders(userIds, 10)
      
      orders.forEach(order => {
        expect(order.items.length).toBeGreaterThanOrEqual(1)
        expect(order.items.length).toBeLessThanOrEqual(3)
        
        // Verify total calculation
        const calculatedTotal = order.items.reduce((sum, item) => sum + item.total, 0)
        expect(order.total).toBeCloseTo(calculatedTotal, 2)
        expect(order.subtotal).toBeCloseTo(calculatedTotal, 2)
      })
    })

    test('should generate reviews with varied ratings', async () => {
      const userIds = ['demo-user-1', 'demo-user-2']
      const reviews = await generateDemoReviews(userIds, 8)
      
      const ratings = reviews.map(r => r.rating)
      const uniqueRatings = [...new Set(ratings)]
      
      // Should have some variety in ratings
      expect(uniqueRatings.length).toBeGreaterThan(1)
      
      // All ratings should be valid
      ratings.forEach(rating => {
        expect(rating).toBeGreaterThanOrEqual(1)
        expect(rating).toBeLessThanOrEqual(5)
      })
    })
  })

  describe('Demo Data Validation', () => {
    test('should generate consistent user data', async () => {
      const users1 = await generateDemoUsers(2)
      const users2 = await generateDemoUsers(2)
      
      // First user should always be the same
      expect(users1[0]).toEqual(users2[0])
    })

    test('should handle edge cases for generation counts', async () => {
      // Test with 0 count
      const noUsers = await generateDemoUsers(0)
      expect(noUsers).toHaveLength(1) // Should still include main demo user
      
      // Test with large count (should be limited by available names)
      const manyUsers = await generateDemoUsers(20)
      expect(manyUsers.length).toBeLessThanOrEqual(9) // Limited by available names
    })

    test('should generate orders with valid date ranges', async () => {
      const userIds = ['demo-user-1']
      const orders = await generateDemoOrders(userIds, 5)
      
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      orders.forEach(order => {
        expect(order.createdAt.getTime()).toBeGreaterThanOrEqual(thirtyDaysAgo.getTime())
        expect(order.createdAt.getTime()).toBeLessThanOrEqual(now.getTime())
        expect(order.updatedAt.getTime()).toBeGreaterThanOrEqual(order.createdAt.getTime())
      })
    })
  })
})