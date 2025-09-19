// CMS Configuration and Validation
import { getConfig } from './config'

export interface CMSValidation {
  isValid: boolean
  endpoint?: string
  hasApiKey: boolean
  hasProjectId: boolean
}

export interface CMSConfig {
  provider: 'contentful' | 'strapi' | 'sanity' | 'custom'
  apiUrl: string
  apiKey: string
  spaceId?: string
  environment?: string
  timeout: number
  retryAttempts: number
  enableCache?: boolean
  cacheTimeout?: number
}

export function validateCMSConfig(): CMSValidation {
  const config = getConfig()
  
  return {
    isValid: config.cms.enabled && !!config.cms.endpoint && !!config.cms.apiKey,
    endpoint: config.cms.endpoint,
    hasApiKey: !!config.cms.apiKey,
    hasProjectId: !!config.cms.projectId
  }
}

export function getCMSConfig(): CMSConfig {
  const config = getConfig()
  
  return {
    provider: (config.cms.provider as 'contentful' | 'strapi' | 'sanity' | 'custom') || 'contentful',
    apiUrl: config.cms.endpoint || '',
    apiKey: config.cms.apiKey || '',
    spaceId: process.env.CONTENTFUL_SPACE_ID,
    environment: process.env.CONTENTFUL_ENVIRONMENT || 'master',
    timeout: 5000,
    retryAttempts: 3,
    enableCache: true,
    cacheTimeout: 300000
  }
}