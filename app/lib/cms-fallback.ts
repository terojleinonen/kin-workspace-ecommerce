import { CMSClient, CMSProduct } from './cms-client'
import { Product } from './types'
import { prisma as db } from './db'

export enum FallbackStrategy {
  CMS_FIRST = 'cms_first',
  CACHE_FIRST = 'cache_first',
  LOCAL_ONLY = 'local_only'
}

export interface FallbackResult<T> {
  data: T
  source: 'cms' | 'local' | 'cache' | 'none'
  isStale: boolean
  error?: string
  circuitBreakerOpen?: boolean
}

export interface ProductsResult {
  products: Product[]
  source: 'cms' | 'local' | 'cache' | 'none'
  isStale: boolean
  error?: string
  circuitBreakerOpen?: boolean
}

export interface ProductResult {
  product: Product | null
  source: 'cms' | 'local' | 'cache' | 'none'
  isStale: boolean
  error?: string
}

export interface SyncStatusInfo {
  isHealthy: boolean
  lastSuccessfulSync: Date | null
  lastAttemptedSync: Date | null
  errorCount: number
  lastError: string | null
  daysSinceLastSync: number
  circuitBreakerOpen: boolean
}

export interface CircuitBreakerState {
  isOpen: boolean
  failureCount: number
  lastFailureTime: Date | null
  nextAttemptTime: Date | null
}

export class CMSFallbackService {
  private cmsClient: CMSClient
  private strategy: FallbackStrategy = FallbackStrategy.CMS_FIRST
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map()
  private circuitBreaker: CircuitBreakerState = {
    isOpen: false,
    failureCount: 0,
    lastFailureTime: null,
    nextAttemptTime: null
  }

  // Circuit breaker configuration
  private readonly FAILURE_THRESHOLD = 5
  private readonly RECOVERY_TIMEOUT = 60000 // 1 minute
  private readonly CACHE_TTL = 300000 // 5 minutes

  constructor(cmsClient: CMSClient) {
    this.cmsClient = cmsClient
  }

  /**
   * Get products with fallback mechanism
   */
  async getProducts(filters?: { category?: string; limit?: number }): Promise<ProductsResult> {
    const cacheKey = `products_${JSON.stringify(filters || {})}`

    try {
      // Check circuit breaker
      if (this.isCircuitBreakerOpen()) {
        return this.getProductsFromLocal(filters, 'Circuit breaker is open')
      }

      // Apply fallback strategy
      switch (this.strategy) {
        case FallbackStrategy.CACHE_FIRST:
          return this.getProductsCacheFirst(cacheKey, filters)
        case FallbackStrategy.LOCAL_ONLY:
          return this.getProductsFromLocal(filters)
        default:
          return this.getProductsCMSFirst(cacheKey, filters)
      }
    } catch (error) {
      console.error('Fallback service error:', error)
      return {
        products: [],
        source: 'none',
        isStale: true,
        error: `Fallback service error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Get single product with fallback
   */
  async getProduct(slug: string): Promise<ProductResult> {
    const cacheKey = `product_${slug}`

    try {
      // Check circuit breaker
      if (this.isCircuitBreakerOpen()) {
        return this.getProductFromLocal(slug, 'Circuit breaker is open')
      }

      // Try CMS first (unless using cache-first strategy)
      if (this.strategy !== FallbackStrategy.CACHE_FIRST && this.strategy !== FallbackStrategy.LOCAL_ONLY) {
        try {
          const cmsProduct = await this.cmsClient.getProduct(slug)
          if (cmsProduct) {
            const product = this.transformCMSProduct(cmsProduct)
            this.cacheProduct(cacheKey, product)
            this.recordSuccess()
            return {
              product,
              source: 'cms',
              isStale: false
            }
          }
        } catch (error) {
          this.recordFailure()
          console.error('CMS Error:', error)
        }
      }

      // Try cache
      const cachedProduct = this.getCachedProduct(cacheKey)
      if (cachedProduct) {
        return {
          product: cachedProduct,
          source: 'cache',
          isStale: true
        }
      }

      // Fallback to local database
      return this.getProductFromLocal(slug)

    } catch (error) {
      console.error('Product fallback error:', error)
      return {
        product: null,
        source: 'none',
        isStale: true,
        error: `Product fallback error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * CMS-first strategy for getting products
   */
  private async getProductsCMSFirst(cacheKey: string, filters?: any): Promise<ProductsResult> {
    try {
      // Try CMS first
      const cmsProducts = await this.cmsClient.getProducts(filters)
      const products = cmsProducts.map(p => this.transformCMSProduct(p))
      
      this.cacheProducts(cacheKey, products)
      this.recordSuccess()
      
      return {
        products,
        source: 'cms',
        isStale: false
      }
    } catch (error) {
      this.recordFailure()
      console.error('CMS Error:', error)

      // Try cache
      const cachedProducts = this.getCachedProducts(cacheKey)
      if (cachedProducts) {
        return {
          products: cachedProducts,
          source: 'cache',
          isStale: true,
          error: `CMS unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }

      // Fallback to local database
      return this.getProductsFromLocal(filters, `CMS unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Cache-first strategy for getting products
   */
  private async getProductsCacheFirst(cacheKey: string, filters?: any): Promise<ProductsResult> {
    // Try cache first
    const cachedProducts = this.getCachedProducts(cacheKey)
    if (cachedProducts) {
      return {
        products: cachedProducts,
        source: 'cache',
        isStale: false
      }
    }

    // Fallback to local database
    return this.getProductsFromLocal(filters)
  }

  /**
   * Get products from local database
   */
  private async getProductsFromLocal(filters?: any, error?: string): Promise<ProductsResult> {
    try {
      const whereClause: any = {}
      if (filters?.category) {
        whereClause.category = filters.category
      }

      const products = await db.product.findMany({
        where: whereClause,
        take: filters?.limit,
        orderBy: { createdAt: 'desc' }
      })

      return {
        products: products as Product[],
        source: products.length > 0 ? 'local' : 'none',
        isStale: true,
        error,
        circuitBreakerOpen: this.circuitBreaker.isOpen
      }
    } catch (dbError) {
      console.error('Database Error:', dbError)
      
      // Try to return cached data as last resort
      const cacheKey = `products_${JSON.stringify(filters || {})}`
      const cachedProducts = this.getCachedProducts(cacheKey)
      if (cachedProducts) {
        return {
          products: cachedProducts,
          source: 'cache',
          isStale: true,
          error: `Both CMS and local data unavailable. Using stale cache.`
        }
      }

      return {
        products: [],
        source: 'none',
        isStale: true,
        error: `Both CMS and local data unavailable: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Get single product from local database
   */
  private async getProductFromLocal(slug: string, error?: string): Promise<ProductResult> {
    try {
      const product = await db.product.findUnique({
        where: { slug }
      })

      return {
        product: product as Product | null,
        source: product ? 'local' : 'none',
        isStale: true,
        error
      }
    } catch (dbError) {
      console.error('Database Error:', dbError)
      return {
        product: null,
        source: 'none',
        isStale: true,
        error: `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Transform CMS product to local product format
   */
  private transformCMSProduct(cmsProduct: CMSProduct): Product {
    const colors = cmsProduct.variants?.map(v => v.color).filter(Boolean) || []

    return {
      id: cmsProduct.id,
      name: cmsProduct.name,
      slug: cmsProduct.slug,
      description: cmsProduct.description,
      price: cmsProduct.price,
      category: cmsProduct.category,
      image: cmsProduct.images[0] || '',
      images: cmsProduct.images,
      variants: cmsProduct.variants,
      tags: cmsProduct.tags,
      inStock: cmsProduct.inStock,
      rating: 0, // Default rating
      colors: [...new Set(colors)]
    }
  }

  /**
   * Cache products
   */
  private cacheProducts(key: string, products: Product[]): void {
    this.cache.set(key, {
      data: products,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    })
  }

  /**
   * Cache single product
   */
  private cacheProduct(key: string, product: Product): void {
    this.cache.set(key, {
      data: product,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    })
  }

  /**
   * Get cached products
   */
  private getCachedProducts(key: string): Product[] | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  /**
   * Get cached product
   */
  private getCachedProduct(key: string): Product | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  /**
   * Circuit breaker management
   */
  private isCircuitBreakerOpen(): boolean {
    if (!this.circuitBreaker.isOpen) return false

    // Check if recovery timeout has passed
    if (this.circuitBreaker.nextAttemptTime && Date.now() > this.circuitBreaker.nextAttemptTime.getTime()) {
      this.circuitBreaker.isOpen = false
      this.circuitBreaker.failureCount = 0
      return false
    }

    return true
  }

  private recordFailure(): void {
    this.circuitBreaker.failureCount++
    this.circuitBreaker.lastFailureTime = new Date()

    if (this.circuitBreaker.failureCount >= this.FAILURE_THRESHOLD) {
      this.circuitBreaker.isOpen = true
      this.circuitBreaker.nextAttemptTime = new Date(Date.now() + this.RECOVERY_TIMEOUT)
    }
  }

  private recordSuccess(): void {
    this.circuitBreaker.failureCount = 0
    this.circuitBreaker.isOpen = false
    this.circuitBreaker.lastFailureTime = null
    this.circuitBreaker.nextAttemptTime = null
  }

  /**
   * Get sync status information
   */
  async getSyncStatus(): Promise<SyncStatusInfo> {
    try {
      const syncStatus = await db.syncStatus.findFirst({
        orderBy: { lastAttemptedSync: 'desc' }
      })

      if (!syncStatus) {
        return {
          isHealthy: false,
          lastSuccessfulSync: null,
          lastAttemptedSync: null,
          errorCount: 0,
          lastError: 'No sync history found',
          daysSinceLastSync: Infinity,
          circuitBreakerOpen: this.circuitBreaker.isOpen
        }
      }

      const daysSinceLastSync = syncStatus.lastSuccessfulSync
        ? (Date.now() - syncStatus.lastSuccessfulSync.getTime()) / (1000 * 60 * 60 * 24)
        : Infinity

      return {
        isHealthy: syncStatus.isHealthy,
        lastSuccessfulSync: syncStatus.lastSuccessfulSync,
        lastAttemptedSync: syncStatus.lastAttemptedSync,
        errorCount: syncStatus.errorCount,
        lastError: syncStatus.lastError,
        daysSinceLastSync,
        circuitBreakerOpen: this.circuitBreaker.isOpen
      }
    } catch (error) {
      console.error('Error getting sync status:', error)
      return {
        isHealthy: false,
        lastSuccessfulSync: null,
        lastAttemptedSync: null,
        errorCount: 0,
        lastError: `Error retrieving sync status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        daysSinceLastSync: Infinity,
        circuitBreakerOpen: this.circuitBreaker.isOpen
      }
    }
  }

  /**
   * Update sync status in database
   */
  async updateSyncStatus(success: boolean, error?: string): Promise<void> {
    try {
      const now = new Date()
      
      await db.syncStatus.upsert({
        where: { id: 1 }, // Assuming single sync status record
        create: {
          lastAttemptedSync: now,
          lastSuccessfulSync: success ? now : null,
          isHealthy: success,
          errorCount: success ? 0 : 1,
          lastError: error || null
        },
        update: {
          lastAttemptedSync: now,
          lastSuccessfulSync: success ? now : undefined,
          isHealthy: success,
          errorCount: success ? 0 : { increment: 1 },
          lastError: error || null
        }
      })
    } catch (dbError) {
      console.error('Error updating sync status:', dbError)
    }
  }

  /**
   * Configuration methods
   */
  setFallbackStrategy(strategy: FallbackStrategy): void {
    this.strategy = strategy
  }

  getFallbackStrategy(): FallbackStrategy {
    return this.strategy
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker = {
      isOpen: false,
      failureCount: 0,
      lastFailureTime: null,
      nextAttemptTime: null
    }
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(): CircuitBreakerState {
    return { ...this.circuitBreaker }
  }
}