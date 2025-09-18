import { CMSFallbackService, FallbackStrategy } from '../app/lib/cms-fallback'
import { CMSClient } from '../app/lib/cms-client'
import { Product } from '../app/lib/types'

// Mock the CMS client
jest.mock('../app/lib/cms-client')
const MockCMSClient = CMSClient as jest.MockedClass<typeof CMSClient>

// Mock the database
jest.mock('../app/lib/db', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn()
    },
    syncStatus: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    }
  }
}))

import { prisma as mockDb } from '../app/lib/db'

describe('CMSFallbackService', () => {
  let fallbackService: CMSFallbackService
  let mockCmsClient: jest.Mocked<CMSClient>

  beforeEach(() => {
    mockCmsClient = new MockCMSClient({
      provider: 'contentful',
      apiUrl: 'https://api.contentful.com',
      apiKey: 'test-key',
      spaceId: 'test-space',
      timeout: 5000,
      retryAttempts: 3
    }) as jest.Mocked<CMSClient>

    fallbackService = new CMSFallbackService(mockCmsClient)
    jest.clearAllMocks()
  })

  describe('getProducts with fallback', () => {
    const mockLocalProducts: Product[] = [
      {
        id: 'local-1',
        name: 'Local Product 1',
        slug: 'local-product-1',
        price: 99.99,
        category: 'Desks',
        image: 'https://example.com/image1.jpg',
        description: 'A local product',
        tags: ['local'],
        inStock: true,
        rating: 4.5,
        colors: ['Black']
      }
    ]

    it('should return CMS products when CMS is available', async () => {
      const mockCmsProducts = [
        {
          id: 'cms-1',
          name: 'CMS Product 1',
          slug: 'cms-product-1',
          description: 'A CMS product',
          price: 149.99,
          category: 'Desks',
          images: ['https://example.com/cms1.jpg'],
          variants: [],
          tags: ['cms'],
          inStock: true,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        }
      ]

      mockCmsClient.getProducts.mockResolvedValueOnce(mockCmsProducts)

      const result = await fallbackService.getProducts()

      expect(result.products).toHaveLength(1)
      expect(result.products[0].name).toBe('CMS Product 1')
      expect(result.source).toBe('cms')
      expect(result.isStale).toBe(false)
      expect(mockCmsClient.getProducts).toHaveBeenCalled()
    })

    it('should fallback to local products when CMS is unavailable', async () => {
      mockCmsClient.getProducts.mockRejectedValueOnce(new Error('CMS unavailable'))
      ;(mockDb.product.findMany as jest.Mock).mockResolvedValueOnce(mockLocalProducts)

      const result = await fallbackService.getProducts()

      expect(result.products).toHaveLength(1)
      expect(result.products[0].name).toBe('Local Product 1')
      expect(result.source).toBe('local')
      expect(result.isStale).toBe(true)
      expect(result.error).toContain('CMS unavailable')
    })

    it('should use cache-first strategy when configured', async () => {
      fallbackService.setFallbackStrategy(FallbackStrategy.CACHE_FIRST)
      ;(mockDb.product.findMany as jest.Mock).mockResolvedValueOnce(mockLocalProducts)

      const result = await fallbackService.getProducts()

      expect(result.source).toBe('local')
      expect(mockCmsClient.getProducts).not.toHaveBeenCalled()
    })

    it('should handle partial CMS failures gracefully', async () => {
      // Mock CMS returning some products but failing for others
      const partialProducts = [
        {
          id: 'cms-1',
          name: 'CMS Product 1',
          slug: 'cms-product-1',
          description: 'A CMS product',
          price: 149.99,
          category: 'Desks',
          images: ['https://example.com/cms1.jpg'],
          variants: [],
          tags: ['cms'],
          inStock: true,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        }
      ]

      mockCmsClient.getProducts.mockResolvedValueOnce(partialProducts)
      ;(mockDb.product.findMany as jest.Mock).mockResolvedValueOnce(mockLocalProducts)

      const result = await fallbackService.getProducts()

      expect(result.products).toHaveLength(1)
      expect(result.source).toBe('cms')
      expect(result.isStale).toBe(false)
    })
  })

  describe('getProduct with fallback', () => {
    it('should return CMS product when available', async () => {
      const mockCmsProduct = {
        id: 'cms-1',
        name: 'CMS Product',
        slug: 'test-product',
        description: 'A CMS product',
        price: 149.99,
        category: 'Desks',
        images: ['https://example.com/cms1.jpg'],
        variants: [],
        tags: ['cms'],
        inStock: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }

      mockCmsClient.getProduct.mockResolvedValueOnce(mockCmsProduct)

      const result = await fallbackService.getProduct('test-product')

      expect(result.product?.name).toBe('CMS Product')
      expect(result.source).toBe('cms')
      expect(mockCmsClient.getProduct).toHaveBeenCalledWith('test-product')
    })

    it('should fallback to local product when CMS fails', async () => {
      const mockLocalProduct: Product = {
        id: 'local-1',
        name: 'Local Product',
        slug: 'test-product',
        price: 99.99,
        category: 'Desks',
        image: 'https://example.com/local1.jpg',
        description: 'A local product',
        tags: ['local'],
        inStock: true,
        rating: 4.0,
        colors: ['Black']
      }

      mockCmsClient.getProduct.mockRejectedValueOnce(new Error('CMS error'))
      ;(mockDb.product.findUnique as jest.Mock).mockResolvedValueOnce(mockLocalProduct)

      const result = await fallbackService.getProduct('test-product')

      expect(result.product?.name).toBe('Local Product')
      expect(result.source).toBe('local')
      expect(result.isStale).toBe(true)
    })

    it('should return null when product not found in either source', async () => {
      mockCmsClient.getProduct.mockResolvedValueOnce(null)
      ;(mockDb.product.findUnique as jest.Mock).mockResolvedValueOnce(null)

      const result = await fallbackService.getProduct('non-existent')

      expect(result.product).toBeNull()
      expect(result.source).toBe('none')
    })
  })

  describe('sync status monitoring', () => {
    it('should track sync status and report errors', async () => {
      const mockSyncStatus = {
        id: 1,
        lastSuccessfulSync: new Date('2023-01-01T00:00:00Z'),
        lastAttemptedSync: new Date('2023-01-02T00:00:00Z'),
        isHealthy: false,
        errorCount: 3,
        lastError: 'Connection timeout'
      }

      ;(mockDb.syncStatus.findFirst as jest.Mock).mockResolvedValueOnce(mockSyncStatus)

      const status = await fallbackService.getSyncStatus()

      expect(status.isHealthy).toBe(false)
      expect(status.errorCount).toBe(3)
      expect(status.lastError).toBe('Connection timeout')
      expect(status.daysSinceLastSync).toBeGreaterThan(0)
    })

    it('should report healthy status when sync is recent', async () => {
      const recentDate = new Date()
      recentDate.setHours(recentDate.getHours() - 1) // 1 hour ago

      const mockSyncStatus = {
        id: 1,
        lastSuccessfulSync: recentDate,
        lastAttemptedSync: recentDate,
        isHealthy: true,
        errorCount: 0,
        lastError: null
      }

      ;(mockDb.syncStatus.findFirst as jest.Mock).mockResolvedValueOnce(mockSyncStatus)

      const status = await fallbackService.getSyncStatus()

      expect(status.isHealthy).toBe(true)
      expect(status.errorCount).toBe(0)
      expect(status.daysSinceLastSync).toBeLessThan(1)
    })
  })

  describe('error reporting', () => {
    it('should log and report CMS errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      mockCmsClient.getProducts.mockRejectedValueOnce(new Error('Network timeout'))
      ;(mockDb.product.findMany as jest.Mock).mockResolvedValueOnce([])

      const result = await fallbackService.getProducts()

      expect(result.error).toContain('Network timeout')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('CMS Error'),
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('should track error frequency and implement circuit breaker', async () => {
      // Simulate multiple failures to trigger circuit breaker
      for (let i = 0; i < 5; i++) {
        mockCmsClient.getProducts.mockRejectedValueOnce(new Error('CMS error'))
        ;(mockDb.product.findMany as jest.Mock).mockResolvedValueOnce([])
        await fallbackService.getProducts()
      }

      // Next call should skip CMS due to circuit breaker
      ;(mockDb.product.findMany as jest.Mock).mockResolvedValueOnce([])
      const result = await fallbackService.getProducts()

      expect(result.source).toBe('none') // No products found in local DB
      expect(result.circuitBreakerOpen).toBe(true)
    })
  })

  describe('graceful degradation', () => {
    it('should provide degraded service when both CMS and local data have issues', async () => {
      mockCmsClient.getProducts.mockRejectedValueOnce(new Error('CMS error'))
      ;(mockDb.product.findMany as jest.Mock).mockRejectedValueOnce(new Error('DB error'))

      const result = await fallbackService.getProducts()

      expect(result.products).toEqual([])
      expect(result.source).toBe('none')
      expect(result.error).toContain('CMS unavailable')
    })

    it('should return cached data when available during failures', async () => {
      // First, populate cache with successful CMS call
      const mockCmsProducts = [
        {
          id: 'cms-1',
          name: 'Cached Product',
          slug: 'cached-product',
          description: 'A cached product',
          price: 99.99,
          category: 'Desks',
          images: [],
          variants: [],
          tags: [],
          inStock: true,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        }
      ]

      mockCmsClient.getProducts.mockResolvedValueOnce(mockCmsProducts)
      await fallbackService.getProducts()

      // Now simulate both CMS and DB failures
      mockCmsClient.getProducts.mockRejectedValueOnce(new Error('CMS error'))
      ;(mockDb.product.findMany as jest.Mock).mockRejectedValueOnce(new Error('DB error'))

      const result = await fallbackService.getProducts()

      expect(result.products).toHaveLength(1)
      expect(result.products[0].name).toBe('Cached Product')
      expect(result.source).toBe('cache')
      expect(result.isStale).toBe(true)
    })
  })
})