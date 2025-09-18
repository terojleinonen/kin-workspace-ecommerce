'use client'

import React, { useState } from 'react'
import { SyncStatusInfo } from '../../lib/cms-fallback'

interface CMSConnectionStatusProps {
  status: SyncStatusInfo
  onTestConnection?: () => Promise<{ success: boolean; status: string; responseTime?: number }>
}

export function CMSConnectionStatus({ status, onTestConnection }: CMSConnectionStatusProps) {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; status: string; responseTime?: number } | null>(null)

  const handleTestConnection = async () => {
    if (!onTestConnection) return

    setTesting(true)
    setTestResult(null)

    try {
      const result = await onTestConnection()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        status: 'error',
        responseTime: undefined
      })
    } finally {
      setTesting(false)
    }
  }

  const getStatusColor = () => {
    if (status.circuitBreakerOpen) return 'text-orange-600'
    return status.isHealthy ? 'text-green-600' : 'text-red-600'
  }

  const getStatusText = () => {
    if (status.circuitBreakerOpen) return 'Circuit Breaker Open'
    return status.isHealthy ? 'Connected' : 'Disconnected'
  }

  const formatLastSync = () => {
    if (!status.lastSuccessfulSync) return 'Never'
    
    const now = new Date()
    const lastSync = new Date(status.lastSuccessfulSync)
    const diffHours = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Less than 1 hour ago'
    if (diffHours < 24) return `${diffHours} hours ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} days ago`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Connection Status</h3>
        {onTestConnection && (
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Main Status */}
        <div className="flex items-center space-x-3">
          <div 
            className={`w-3 h-3 rounded-full ${
              status.circuitBreakerOpen 
                ? 'bg-orange-500' 
                : status.isHealthy 
                  ? 'bg-green-500' 
                  : 'bg-red-500'
            }`}
            data-testid={`status-indicator-${status.isHealthy ? 'healthy' : 'unhealthy'}`}
          />
          <span className={`font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          <span className="text-sm text-gray-500">
            {status.isHealthy ? 'Healthy' : 'Unhealthy'}
          </span>
        </div>

        {/* Circuit Breaker Indicator */}
        {status.circuitBreakerOpen && (
          <div 
            className="flex items-center space-x-2 p-3 bg-orange-50 border border-orange-200 rounded-md"
            data-testid="circuit-breaker-indicator"
          >
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className="text-sm text-orange-800">
              Circuit breaker is open - using fallback data
            </span>
          </div>
        )}

        {/* Sync Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Last Sync:</span>
            <div className="font-medium text-gray-900">{formatLastSync()}</div>
          </div>
          <div>
            <span className="text-gray-500">Error Count:</span>
            <div className="font-medium text-gray-900">{status.errorCount} errors</div>
          </div>
        </div>

        {/* Last Error */}
        {status.lastError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <span className="text-sm text-red-800">
              <strong>Last Error:</strong> {status.lastError}
            </span>
          </div>
        )}

        {/* Test Result */}
        {testResult && (
          <div className={`p-3 border rounded-md ${
            testResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className={`text-sm ${
              testResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              <strong>Test Result:</strong> {testResult.status}
              {testResult.responseTime && (
                <span className="ml-2">({testResult.responseTime}ms)</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}