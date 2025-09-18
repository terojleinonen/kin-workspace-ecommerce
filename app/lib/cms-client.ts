// CMS Client for product synchronization
export interface CMSConfig {
  provider: 'contentful' | 'strapi' | 'sanity' | 'custom'
  apiUrl: string
  apiKey: string
  spaceId?: string // For Contentful
  environment?: string // For Contentful
  timeout: number
  retryAttempts: number
  enableCache?: boolean
  cacheTimeout?: number
}

export interface CMSProduct {
  id: string
  name: string
  slug: string
  description: string
  price: number
  category: string
  images: string[]
  variants?: Array<{
    id: string
    color: string
    colorHex: string
    size?: string
    price: number
    stock: number
    images: string[]
  }>
  tags: string[]
  inStock: boolean
  createdAt: string
  updatedAt: string
}

export interface ConnectionResult {
  success: boolean
  status: 'connected' | 'error' | 'unauthorized' | 'timeout'
  error?: string
  responseTime?: number
}

export interface HealthStatus {
  isHealthy: boolean
  responseTime: number
  lastChecked: Date
  error?: string
  version?: string
}

export interface SyncResult {
  success: boolean
  productsUpdated: number
  productsAdded: number
  productsRemoved: number
  errors: string[]
  lastSync: Date
  duration: number
}

export class CMSClient {
  private config: CMSConfig
  private cache: Map<string, { data: any; timestamp: number }> = new Map()

  constructor(config: CMSConfig) {
    this.validateConfig(config)
    this.config = config
  }

  private validateConfig(config: CMSConfig): void {
    if (!config.apiUrl || !config.apiKey) {
      throw new Error('Invalid CMS configuration: apiUrl and apiKey are required')
    }
    
    if (config.provider === 'contentful' && !config.spaceId) {
      throw new Error('Invalid CMS configuration: spaceId is required for Contentful')
    }

    if (config.timeout <= 0 || config.retryAttempts < 0) {
      throw new Error('Invalid CMS configuration: timeout must be positive and retryAttempts non-negative')
    }
  }

  getConfig(): CMSConfig {
    return { ...this.config }
  }

  async testConnection(): Promise<ConnectionResult> {
    const startTime = Date.now()
    
    try {
      const url = this.buildHealthCheckUrl()
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      const responseTime = Date.now() - startTime

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          status: 'unauthorized',
          error: 'Authentication failed: Invalid API key or insufficient permissions',
          responseTime
        }
      }

      if (!response.ok) {
        return {
          success: false,
          status: 'error',
          error: `HTTP ${response.status}: ${response.statusText}`,
          responseTime
        }
      }

      return {
        success: true,
        status: 'connected',
        responseTime
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          return {
            success: false,
            status: 'timeout',
            error: `Connection timeout after ${this.config.timeout}ms`,
            responseTime
          }
        }
        
        return {
          success: false,
          status: 'error',
          error: error.message,
          responseTime
        }
      }

      return {
        success: false,
        status: 'error',
        error: 'Unknown connection error',
        responseTime
      }
    }
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const startTime = Date.now()
    
    try {
      const url = this.buildHealthCheckUrl()
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      const responseTime = Date.now() - startTime

      if (response.ok) {
        let version: string | undefined
        try {
          const data = await response.json()
          version = data.version || data.sys?.version
        } catch {
          // Ignore JSON parsing errors for health check
        }

        return {
          isHealthy: true,
          responseTime,
          lastChecked: new Date(),
          version
        }
      }

      return {
        isHealthy: false,
        responseTime,
        lastChecked: new Date(),
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      return {
        isHealthy: false,
        responseTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getProducts(filters?: { category?: string; limit?: number; offset?: number }): Promise<CMSProduct[]> {
    const cacheKey = `products_${JSON.stringify(filters || {})}`
    
    // Check cache if enabled
    if (this.config.enableCache && this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data
    }

    try {
      const url = this.buildProductsUrl(filters)
      const response = await this.fetchWithRetry(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch products: HTTP ${response.status}`)
      }

      const data = await response.json()
      const products = this.transformProductsData(data)

      // Cache the result if enabled
      if (this.config.enableCache) {
        this.cache.set(cacheKey, {
          data: products,
          timestamp: Date.now()
        })
      }

      return products
    } catch (error) {
      throw new Error(`Failed to fetch products: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getProduct(slug: string): Promise<CMSProduct | null> {
    const cacheKey = `product_${slug}`
    
    // Check cache if enabled
    if (this.config.enableCache && this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data
    }

    try {
      const url = this.buildProductUrl(slug)
      const response = await this.fetchWithRetry(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      if (response.status === 404) {
        return null
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch product: HTTP ${response.status}`)
      }

      const data = await response.json()
      const product = this.transformProductData(data)

      // Cache the result if enabled
      if (this.config.enableCache) {
        this.cache.set(cacheKey, {
          data: product,
          timestamp: Date.now()
        })
      }

      return product
    } catch (error) {
      throw new Error(`Failed to fetch product: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private buildHealthCheckUrl(): string {
    switch (this.config.provider) {
      case 'contentful':
        return `${this.config.apiUrl}/spaces/${this.config.spaceId}/environments/${this.config.environment || 'master'}`
      case 'strapi':
        return `${this.config.apiUrl}/admin/init`
      case 'sanity':
        return `${this.config.apiUrl}/ping`
      default:
        return `${this.config.apiUrl}/health`
    }
  }

  private buildProductsUrl(filters?: { category?: string; limit?: number; offset?: number }): string {
    const baseUrl = this.getProductsEndpoint()
    const params = new URLSearchParams()

    if (filters?.category) {
      params.append('category', filters.category)
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString())
    }
    if (filters?.offset) {
      params.append('offset', filters.offset.toString())
    }

    return `${baseUrl}?${params.toString()}`
  }

  private buildProductUrl(slug: string): string {
    const baseUrl = this.getProductsEndpoint()
    return `${baseUrl}/${slug}`
  }

  private getProductsEndpoint(): string {
    switch (this.config.provider) {
      case 'contentful':
        return `${this.config.apiUrl}/spaces/${this.config.spaceId}/environments/${this.config.environment || 'master'}/entries`
      case 'strapi':
        return `${this.config.apiUrl}/api/products`
      case 'sanity':
        return `${this.config.apiUrl}/query`
      default:
        return `${this.config.apiUrl}/products`
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    switch (this.config.provider) {
      case 'contentful':
        headers['Authorization'] = `Bearer ${this.config.apiKey}`
        break
      case 'strapi':
        headers['Authorization'] = `Bearer ${this.config.apiKey}`
        break
      case 'sanity':
        headers['Authorization'] = `Bearer ${this.config.apiKey}`
        break
      default:
        headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }

    return headers
  }

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeout}ms`)
      }
      throw error
    }
  }

  private async fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        return await this.fetchWithTimeout(url, options)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        if (attempt < this.config.retryAttempts) {
          // Exponential backoff: wait 2^attempt * 1000ms
          const delay = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError
  }

  private transformProductsData(data: any): CMSProduct[] {
    switch (this.config.provider) {
      case 'contentful':
        return this.transformContentfulProducts(data)
      case 'strapi':
        return this.transformStrapiProducts(data)
      case 'sanity':
        return this.transformSanityProducts(data)
      default:
        return this.transformGenericProducts(data)
    }
  }

  private transformProductData(data: any): CMSProduct {
    const products = this.transformProductsData({ items: [data] })
    return products[0]
  }

  private transformContentfulProducts(data: any): CMSProduct[] {
    if (!data.items || !Array.isArray(data.items)) {
      return []
    }

    return data.items.map((item: any) => ({
      id: item.sys.id,
      name: item.fields.name || '',
      slug: item.fields.slug || '',
      description: item.fields.description || '',
      price: item.fields.price || 0,
      category: item.fields.category || '',
      images: item.fields.images?.map((img: any) => img.fields?.file?.url || '') || [],
      variants: item.fields.variants || [],
      tags: item.fields.tags || [],
      inStock: item.fields.inStock !== false,
      createdAt: item.sys.createdAt,
      updatedAt: item.sys.updatedAt
    }))
  }

  private transformStrapiProducts(data: any): CMSProduct[] {
    if (!data.data || !Array.isArray(data.data)) {
      return []
    }

    return data.data.map((item: any) => ({
      id: item.id.toString(),
      name: item.attributes.name || '',
      slug: item.attributes.slug || '',
      description: item.attributes.description || '',
      price: item.attributes.price || 0,
      category: item.attributes.category || '',
      images: item.attributes.images?.data?.map((img: any) => img.attributes?.url || '') || [],
      variants: item.attributes.variants || [],
      tags: item.attributes.tags || [],
      inStock: item.attributes.inStock !== false,
      createdAt: item.attributes.createdAt,
      updatedAt: item.attributes.updatedAt
    }))
  }

  private transformSanityProducts(data: any): CMSProduct[] {
    if (!data.result || !Array.isArray(data.result)) {
      return []
    }

    return data.result.map((item: any) => ({
      id: item._id,
      name: item.name || '',
      slug: item.slug?.current || '',
      description: item.description || '',
      price: item.price || 0,
      category: item.category || '',
      images: item.images?.map((img: any) => img.asset?.url || '') || [],
      variants: item.variants || [],
      tags: item.tags || [],
      inStock: item.inStock !== false,
      createdAt: item._createdAt,
      updatedAt: item._updatedAt
    }))
  }

  private transformGenericProducts(data: any): CMSProduct[] {
    if (!Array.isArray(data)) {
      return []
    }

    return data.map((item: any) => ({
      id: item.id?.toString() || '',
      name: item.name || '',
      slug: item.slug || '',
      description: item.description || '',
      price: item.price || 0,
      category: item.category || '',
      images: item.images || [],
      variants: item.variants || [],
      tags: item.tags || [],
      inStock: item.inStock !== false,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString()
    }))
  }

  private isCacheValid(key: string): boolean {
    if (!this.config.enableCache) return false
    
    const cached = this.cache.get(key)
    if (!cached) return false

    const cacheTimeout = this.config.cacheTimeout || 300000 // 5 minutes default
    return Date.now() - cached.timestamp < cacheTimeout
  }

  clearCache(): void {
    this.cache.clear()
  }
}