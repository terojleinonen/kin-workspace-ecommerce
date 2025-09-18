import { ProductSyncService, SyncOptions, SyncResult } from '../app/lib/product-sync'
import { CMSClient, CMSProduct } from '../app/lib/cms-client'
import { Product } from '../app/lib/types'

// Mock the CMS client
jest.mock('../app/lib/cms-client')
const MockCMSClient = CMSClient as jest.MockedClass<typeof CMSClient>

// Mock the database
jest.mock('../app/lib/db', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn()
    }
  }
}))

import { prisma as mockDb } from '../app/lib/db'

describe('ProductSyncService', () => {
  let syncService: ProductSyncService
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

    syncService = new ProductSyncService(mockCmsClient)
    jest.clearAllMocks()
  })

  describe('syncProducts', () => {
    it('should successfully sync products from CMS', async () => {
      const mockCmsProducts: CMSProduct[] = [
        {
          id: 'cms-1',
          name: 'Test Product 1',
          slug: 'test-product-1',
          description: 'A test product',
          price: 99.99,
          category: 'Desks',
          images: ['https://example.com/image1.jpg'],
          variants: [],
          tags: ['test'],
          inStock: true,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        }
      ]

      mockCmsClient.getProducts.mockResolvedValueOnce(mockCmsProducts)
      ;(mockDb.product.findMany as jest.Mock).mockResolvedValueOnce([])
      ;(mockDb.product.upsert as jest.Mock).mockResolvedValueOnce({})

      const result = await syncService.syncProducts()

      expect(result.success).toBe(true)
      expect(result.productsAdded).toBe(1)
      expect(result.productsUpdated).toBe(0)
      expect(result.errors).toHaveLength(0)
      expect(mockCmsClient.getProducts).toHaveBeenCalled()
      expect(mockDb.product.upsert as jest.Mock).toHaveBeenCalledWith({
        where: { slug: 'test-product-1' },
        create: expect.objectContaining({
          name: 'Test Product 1',
          slug: 'test-product-1',
          price: 99.99
        }),
        update: expect.objectContaining({
          name: 'Test Product 1',
          price: 99.99
        })
      })
    })

    it('should update existing products when they differ', async () => {
      const mockCmsProducts: CMSProduct[] = [
        {
          id: 'cms-1',
          name: 'Updated Product Name',
          slug: 'test-product-1',
          description: 'Updated description',
          price: 149.99,
          category: 'Desks',
          images: ['https://example.com/image1.jpg'],
          variants: [],
          tags: ['test'],
          inStock: true,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-02T00:00:00Z'
        }
      ]

      const existingProducts = [
        {
          id: 'local-1',
          slug: 'test-product-1',
          name: 'Old Product Name',
          price: 99.99,
          updatedAt: new Date('2023-01-01T00:00:00Z')
        }
      ]

      mockCmsClient.getProducts.mockResolvedValueOnce(mockCmsProducts)
      ;(mockDb.product.findMany as jest.Mock).mockResolvedValueOnce(existingProducts)
      ;(mockDb.product.upsert as jest.Mock).mockResolvedValueOnce({})

      const result = await syncService.syncProducts()

      expect(result.success).toBe(true)
      expect(result.productsUpdated).toBe(1)
      expect(result.productsAdded).toBe(0)
    })

    it('should handle CMS errors gracefully', async () => {
      mockCmsClient.getProducts.mockRejectedValueOnce(new Error('CMS connection failed'))

      const result = await syncService.syncProducts()

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Failed to fetch products from CMS: CMS connection failed')
    })

    it('should handle database errors gracefully', async () => {
      const mockCmsProducts: CMSProduct[] = [
        {
          id: 'cms-1',
          name: 'Test Product',
          slug: 'test-product',
          description: 'A test product',
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
      ;(mockDb.product.findMany as jest.Mock).mockResolvedValueOnce([])
      ;(mockDb.product.upsert as jest.Mock).mockRejectedValueOnce(new Error('Database error'))

      const result = await syncService.syncProducts()

      expect(result.success).toBe(true) // Sync continues despite individual product errors
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('Database error')
    })

    it('should respect sync options', async () => {
      const options: SyncOptions = {
        category: 'Desks',
        dryRun: true,
        batchSize: 10
      }

      mockCmsClient.getProducts.mockResolvedValueOnce([])

      await syncService.syncProducts(options)

      expect(mockCmsClient.getProducts).toHaveBeenCalledWith({
        category: 'Desks'
      })
    })
  })

  describe('data transformation', () => {
    it('should correctly transform CMS product to local product format', () => {
      const cmsProduct: CMSProduct = {
        id: 'cms-1',
        name: 'Test Product',
        slug: 'test-product',
        description: 'A test product',
        price: 99.99,
        category: 'Desks',
        images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        variants: [
          {
            id: 'var-1',
            color: 'Black',
            colorHex: '#000000',
            price: 99.99,
            stock: 10,
            images: ['https://example.com/var1.jpg']
          }
        ],
        tags: ['modern', 'workspace'],
        inStock: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }

      const transformed = syncService.transformCMSProduct(cmsProduct)

      expect(transformed).toEqual({
        name: 'Test Product',
        slug: 'test-product',
        description: 'A test product',
        price: 99.99,
        category: 'Desks',
        image: 'https://example.com/image1.jpg',
        images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        variants: [
          {
            id: 'var-1',
            color: 'Black',
            colorHex: '#000000',
            price: 99.99,
            stock: 10,
            images: ['https://example.com/var1.jpg']
          }
        ],
        tags: ['modern', 'workspace'],
        inStock: true,
        rating: 0,
        colors: ['Black']
      })
    })

    it('should handle missing optional fields gracefully', () => {
      const minimalCmsProduct: CMSProduct = {
        id: 'cms-1',
        name: 'Minimal Product',
        slug: 'minimal-product',
        description: '',
        price: 50,
        category: 'Accessories',
        images: [],
        variants: [],
        tags: [],
        inStock: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }

      const transformed = syncService.transformCMSProduct(minimalCmsProduct)

      expect(transformed.image).toBe('')
      expect(transformed.images).toEqual([])
      expect(transformed.variants).toEqual([])
      expect(transformed.tags).toEqual([])
      expect(transformed.colors).toEqual([])
    })
  })

  describe('image optimization', () => {
    it('should optimize image URLs for different sizes', () => {
      const originalUrl = 'https://images.ctfassets.net/space/asset.jpg'
      
      const optimized = syncService.optimizeImageUrl(originalUrl, { width: 800, height: 600, quality: 80 })
      
      expect(optimized).toContain('w=800')
      expect(optimized).toContain('h=600')
      expect(optimized).toContain('q=80')
    })

    it('should handle non-Contentful URLs gracefully', () => {
      const originalUrl = 'https://example.com/image.jpg'
      
      const optimized = syncService.optimizeImageUrl(originalUrl, { width: 800 })
      
      expect(optimized).toBe(originalUrl)
    })
  })

  describe('sync status reporting', () => {
    it('should track sync progress and report status', async () => {
      const mockCmsProducts: CMSProduct[] = Array.from({ length: 5 }, (_, i) => ({
        id: `cms-${i}`,
        name: `Product ${i}`,
        slug: `product-${i}`,
        description: '',
        price: 100,
        category: 'Test',
        images: [],
        variants: [],
        tags: [],
        inStock: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }))

      mockCmsClient.getProducts.mockResolvedValueOnce(mockCmsProducts)
      ;(mockDb.product.findMany as jest.Mock).mockResolvedValueOnce([])
      ;(mockDb.product.upsert as jest.Mock).mockResolvedValue({})

      const result = await syncService.syncProducts()

      expect(result.productsAdded).toBe(5)
      expect(result.duration).toBeGreaterThanOrEqual(0)
      expect(result.lastSync).toBeInstanceOf(Date)
    })
  })
})