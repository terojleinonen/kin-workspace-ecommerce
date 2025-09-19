import { CMSClient, CMSProduct, SyncResult } from './cms-client'
import { Product } from './types'
import { prisma as db } from './db'

export interface SyncOptions {
  category?: string
  dryRun?: boolean
  batchSize?: number
  forceUpdate?: boolean
}

export interface ImageOptimizationOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'jpg' | 'png'
}

export interface SyncStatus {
  isRunning: boolean
  progress: number
  currentStep: string
  startTime?: Date
  estimatedCompletion?: Date
}

export class ProductSyncService {
  private cmsClient: CMSClient
  private syncStatus: SyncStatus = {
    isRunning: false,
    progress: 0,
    currentStep: 'idle'
  }

  constructor(cmsClient: CMSClient) {
    this.cmsClient = cmsClient
  }

  /**
   * Synchronize products from CMS to local database
   */
  async syncProducts(options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = Date.now()
    this.updateSyncStatus({
      isRunning: true,
      progress: 0,
      currentStep: 'Fetching products from CMS',
      startTime: new Date()
    })

    const result: SyncResult = {
      success: false,
      productsUpdated: 0,
      productsAdded: 0,
      productsRemoved: 0,
      errors: [],
      lastSync: new Date(),
      duration: 0
    }

    try {
      // Fetch products from CMS
      this.updateSyncStatus({ progress: 10, currentStep: 'Fetching products from CMS' })
      const cmsProducts = await this.cmsClient.getProducts(
        options.category ? { category: options.category } : undefined
      )

      if (cmsProducts.length === 0) {
        this.updateSyncStatus({ isRunning: false, progress: 100, currentStep: 'completed' })
        return { ...result, success: true, duration: Date.now() - startTime }
      }

      // Fetch existing products from database
      this.updateSyncStatus({ progress: 20, currentStep: 'Loading existing products' })
      const existingProducts = await db.product.findMany({
        select: {
          id: true,
          slug: true,
          name: true,
          price: true,
          updatedAt: true
        }
      })

      const existingProductMap = new Map(
        existingProducts.map(p => [p.slug, p])
      )

      // Process products in batches
      const batchSize = options.batchSize || 10
      const batches = this.chunkArray(cmsProducts, batchSize)
      let processedCount = 0

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        const progress = 20 + ((i + 1) / batches.length) * 70
        
        this.updateSyncStatus({
          progress,
          currentStep: `Processing batch ${i + 1} of ${batches.length}`
        })

        await this.processBatch(batch, existingProductMap, result, options)
        processedCount += batch.length
      }

      // Handle removed products (products that exist locally but not in CMS)
      if (!options.category) { // Only check for removed products in full sync
        this.updateSyncStatus({ progress: 95, currentStep: 'Checking for removed products' })
        await this.handleRemovedProducts(cmsProducts, existingProducts, result, options)
      }

      result.success = true
      result.duration = Date.now() - startTime

      this.updateSyncStatus({
        isRunning: false,
        progress: 100,
        currentStep: 'completed'
      })

    } catch (error) {
      result.errors.push(`Failed to fetch products from CMS: ${error instanceof Error ? error.message : 'Unknown error'}`)
      result.duration = Date.now() - startTime
      
      this.updateSyncStatus({
        isRunning: false,
        progress: 0,
        currentStep: 'error'
      })
    }

    return result
  }

  /**
   * Process a batch of CMS products
   */
  private async processBatch(
    cmsProducts: CMSProduct[],
    existingProductMap: Map<string, any>,
    result: SyncResult,
    options: SyncOptions
  ): Promise<void> {
    for (const cmsProduct of cmsProducts) {
      try {
        const existingProduct = existingProductMap.get(cmsProduct.slug)
        const transformedProduct = this.transformCMSProduct(cmsProduct)

        if (options.dryRun) {
          // In dry run mode, just count what would be changed
          if (existingProduct) {
            if (this.shouldUpdateProduct(cmsProduct, existingProduct, options.forceUpdate)) {
              result.productsUpdated++
            }
          } else {
            result.productsAdded++
          }
          continue
        }

        // Upsert product in database
        await db.product.upsert({
          where: { slug: cmsProduct.slug },
          create: {
            ...transformedProduct,
            id: undefined, // Let database generate ID
            createdBy: 'system' // Required field for product creation
          },
          update: transformedProduct
        })

        if (existingProduct) {
          result.productsUpdated++
        } else {
          result.productsAdded++
        }

      } catch (error) {
        result.errors.push(`Failed to sync product ${cmsProduct.slug}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  /**
   * Handle products that were removed from CMS
   */
  private async handleRemovedProducts(
    cmsProducts: CMSProduct[],
    existingProducts: any[],
    result: SyncResult,
    options: SyncOptions
  ): Promise<void> {
    const cmsSlugs = new Set(cmsProducts.map(p => p.slug))
    const removedProducts = existingProducts.filter(p => !cmsSlugs.has(p.slug))

    for (const removedProduct of removedProducts) {
      try {
        if (!options.dryRun) {
          await db.product.delete({
            where: { id: removedProduct.id }
          })
        }
        result.productsRemoved++
      } catch (error) {
        result.errors.push(`Failed to remove product ${removedProduct.slug}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  /**
   * Transform CMS product to local product format
   */
  transformCMSProduct(cmsProduct: CMSProduct): Omit<Product, 'id'> {
    // Optimize images
    const optimizedImages = cmsProduct.images.map(url => 
      this.optimizeImageUrl(url, { width: 800, quality: 85 })
    )

    // Extract colors from variants
    const colors = cmsProduct.variants?.map(v => v.color).filter(Boolean) || []

    return {
      name: cmsProduct.name,
      slug: cmsProduct.slug,
      description: cmsProduct.description,
      price: cmsProduct.price,
      category: cmsProduct.category,
      image: optimizedImages[0] || '',
      images: optimizedImages,
      variants: cmsProduct.variants || [],
      tags: cmsProduct.tags,
      inStock: cmsProduct.inStock,
      rating: 0, // Default rating, can be calculated separately
      colors: [...new Set(colors)] // Remove duplicates
    }
  }

  /**
   * Optimize image URL for different sizes and formats
   */
  optimizeImageUrl(url: string, options: ImageOptimizationOptions = {}): string {
    // Handle Contentful images
    if (url.includes('ctfassets.net') || url.includes('contentful.com')) {
      const params = new URLSearchParams()
      
      if (options.width) params.append('w', options.width.toString())
      if (options.height) params.append('h', options.height.toString())
      if (options.quality) params.append('q', options.quality.toString())
      if (options.format) params.append('fm', options.format)
      
      const separator = url.includes('?') ? '&' : '?'
      return `${url}${separator}${params.toString()}`
    }

    // Handle Strapi images
    if (url.includes('/uploads/')) {
      // Strapi image transformations would go here
      return url
    }

    // Handle Sanity images
    if (url.includes('cdn.sanity.io')) {
      let transformedUrl = url
      
      if (options.width || options.height) {
        const dimensions = []
        if (options.width) dimensions.push(`w=${options.width}`)
        if (options.height) dimensions.push(`h=${options.height}`)
        transformedUrl += `?${dimensions.join('&')}`
      }
      
      return transformedUrl
    }

    // Return original URL if no optimization is available
    return url
  }

  /**
   * Check if a product should be updated
   */
  private shouldUpdateProduct(
    cmsProduct: CMSProduct,
    existingProduct: any,
    forceUpdate = false
  ): boolean {
    if (forceUpdate) return true

    // Compare update timestamps
    const cmsUpdated = new Date(cmsProduct.updatedAt)
    const localUpdated = new Date(existingProduct.updatedAt)
    
    return cmsUpdated > localUpdated
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus }
  }

  /**
   * Update sync status
   */
  private updateSyncStatus(updates: Partial<SyncStatus>): void {
    this.syncStatus = { ...this.syncStatus, ...updates }
  }

  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  /**
   * Manual sync trigger with options
   */
  async triggerSync(options: SyncOptions = {}): Promise<SyncResult> {
    if (this.syncStatus.isRunning) {
      throw new Error('Sync is already in progress')
    }

    return this.syncProducts(options)
  }

  /**
   * Get sync history (would be stored in database in real implementation)
   */
  async getSyncHistory(limit = 10): Promise<SyncResult[]> {
    // In a real implementation, this would fetch from a sync_history table
    // For now, return empty array
    return []
  }

  /**
   * Cache management
   */
  clearImageCache(): void {
    // In a real implementation, this would clear cached optimized images
    console.log('Image cache cleared')
  }
}