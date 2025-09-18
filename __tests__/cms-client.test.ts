import { CMSClient, CMSConfig, CMSProduct, SyncResult } from '../app/lib/cms-client'

// Mock fetch for testing
global.fetch = jest.fn()

describe('CMSClient', () => {
  let cmsClient: CMSClient
  let mockConfig: CMSConfig

  beforeEach(() => {
    mockConfig = {
      provider: 'contentful',
      apiUrl: 'https://api.contentful.com',
      apiKey: 'test-api-key',
      spaceId: 'test-space-id',
      environment: 'master',
      timeout: 5000,
      retryAttempts: 3
    }
    cmsClient = new CMSClient(mockConfig)
    jest.clearAllMocks()
  })

  describe('constructor', () => {
    it('should create CMS client with valid configuration', () => {
      expect(cmsClient).toBeInstanceOf(CMSClient)
      expect(cmsClient.getConfig()).toEqual(mockConfig)
    })

    it('should throw error with invalid configuration', () => {
      const invalidConfig = { ...mockConfig, apiKey: '' }
      expect(() => new CMSClient(invalidConfig)).toThrow('Invalid CMS configuration')
    })
  })

  describe('connection testing', () => {
    it('should successfully test connection when CMS is available', async () => {
      const mockResponse = { ok: true, status: 200 }
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const result = await cmsClient.testConnection()

      expect(result.success).toBe(true)
      expect(result.status).toBe('connected')
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.contentful.com'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      )
    })

    it('should handle connection failure gracefully', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const result = await cmsClient.testConnection()

      expect(result.success).toBe(false)
      expect(result.status).toBe('error')
      expect(result.error).toContain('Network error')
    })

    it('should handle authentication errors', async () => {
      const mockResponse = { ok: false, status: 401, statusText: 'Unauthorized' }
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const result = await cmsClient.testConnection()

      expect(result.success).toBe(false)
      expect(result.status).toBe('unauthorized')
      expect(result.error).toContain('Authentication failed')
    })
  })

  describe('health checks', () => {
    it('should perform health check and return status', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ status: 'healthy', version: '1.0.0' })
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const health = await cmsClient.getHealthStatus()

      expect(health.isHealthy).toBe(true)
      expect(health.responseTime).toBeGreaterThanOrEqual(0)
      expect(health.lastChecked).toBeInstanceOf(Date)
    })

    it('should handle unhealthy CMS responses', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Service unavailable'))

      const health = await cmsClient.getHealthStatus()

      expect(health.isHealthy).toBe(false)
      expect(health.error).toContain('Service unavailable')
    })
  })

  describe('error handling', () => {
    it('should retry failed requests up to configured limit', async () => {
      ;(fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })

      await cmsClient.getProducts()

      expect(fetch).toHaveBeenCalledTimes(3)
    })

    it('should respect timeout configuration', async () => {
      const shortTimeoutConfig = { ...mockConfig, timeout: 100 }
      const shortTimeoutClient = new CMSClient(shortTimeoutConfig)

      // Mock a slow response that will be aborted
      ;(fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise((resolve, reject) => {
          setTimeout(() => {
            const error = new Error('AbortError')
            error.name = 'AbortError'
            reject(error)
          }, 50)
        })
      )

      const result = await shortTimeoutClient.testConnection()
      expect(result.success).toBe(false)
      expect(result.status).toBe('timeout')
      expect(result.error).toContain('timeout')
    })
  })
})