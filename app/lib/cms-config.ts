// CMS Configuration and Validation
import { getConfig } from './config'

export interface CMSValidation {
  isValid: boolean
  endpoint?: string
  hasApiKey: boolean
  hasProjectId: boolean
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