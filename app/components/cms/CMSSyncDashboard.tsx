'use client'

import React, { useState, useEffect } from 'react'
import { CMSConnectionStatus } from './CMSConnectionStatus'
import { CMSSyncHistory } from './CMSSyncHistory'
import { SyncStatusInfo } from '../../lib/cms-fallback'
import { SyncResult } from '../../lib/cms-client'

interface CMSSyncDashboardProps {
  initialStatus?: SyncStatusInfo
  initialHistory?: SyncResult[]
  onTriggerSync?: (options?: { category?: string; forceUpdate?: boolean }) => Promise<SyncResult>
  onTestConnection?: () => Promise<{ success: boolean; status: string; responseTime?: number }>
  onRefreshStatus?: () => Promise<SyncStatusInfo>
  onRefreshHistory?: () => Promise<SyncResult[]>
}

interface SyncOptions {
  category?: string
  forceUpdate?: boolean
}

export function CMSSyncDashboard({
  initialStatus,
  initialHistory = [],
  onTriggerSync,
  onTestConnection,
  onRefreshStatus,
  onRefreshHistory
}: CMSSyncDashboardProps) {
  const [status, setStatus] = useState<SyncStatusInfo | null>(initialStatus || null)
  const [history, setHistory] = useState<SyncResult[]>(initialHistory)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null)
  const [syncOptions, setSyncOptions] = useState<SyncOptions>({})

  // Auto-refresh status every 30 seconds
  useEffect(() => {
    if (!onRefreshStatus) return

    const interval = setInterval(async () => {
      try {
        const newStatus = await onRefreshStatus()
        setStatus(newStatus)
      } catch (error) {
        console.error('Failed to refresh status:', error)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [onRefreshStatus])

  const handleTriggerSync = async () => {
    if (!onTriggerSync || syncing) return

    setSyncing(true)
    setLastSyncResult(null)

    try {
      const result = await onTriggerSync(syncOptions)
      setLastSyncResult(result)
      
      // Refresh status and history after sync
      if (onRefreshStatus) {
        const newStatus = await onRefreshStatus()
        setStatus(newStatus)
      }
      
      if (onRefreshHistory) {
        const newHistory = await onRefreshHistory()
        setHistory(newHistory)
      }
    } catch (error) {
      console.error('Sync failed:', error)
      setLastSyncResult({
        success: false,
        productsUpdated: 0,
        productsAdded: 0,
        productsRemoved: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        lastSync: new Date(),
        duration: 0
      })
    } finally {
      setSyncing(false)
    }
  }

  const handleRefreshStatus = async () => {
    if (!onRefreshStatus) return

    try {
      const newStatus = await onRefreshStatus()
      setStatus(newStatus)
    } catch (error) {
      console.error('Failed to refresh status:', error)
    }
  }

  const formatSyncResult = (result: SyncResult) => {
    const parts = []
    if (result.productsUpdated > 0) parts.push(`${result.productsUpdated} updated`)
    if (result.productsAdded > 0) parts.push(`${result.productsAdded} added`)
    if (result.productsRemoved > 0) parts.push(`${result.productsRemoved} removed`)
    
    return parts.length > 0 ? parts.join(', ') : 'No changes'
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">CMS Sync Dashboard</h1>
        {onRefreshStatus && (
          <button
            onClick={handleRefreshStatus}
            className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Refresh Status
          </button>
        )}
      </div>

      {/* Status and Manual Sync */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Status */}
        {status && (
          <CMSConnectionStatus 
            status={status} 
            onTestConnection={onTestConnection}
          />
        )}

        {/* Manual Sync */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Sync</h3>
          
          {/* Sync Options */}
          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Category Filter (optional)
              </label>
              <select
                id="category-filter"
                value={syncOptions.category || ''}
                onChange={(e) => setSyncOptions(prev => ({ 
                  ...prev, 
                  category: e.target.value || undefined 
                }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                disabled={syncing}
              >
                <option value="">All Categories</option>
                <option value="Desks">Desks</option>
                <option value="Accessories">Accessories</option>
                <option value="Lighting">Lighting</option>
                <option value="Seating">Seating</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="force-update"
                checked={syncOptions.forceUpdate || false}
                onChange={(e) => setSyncOptions(prev => ({ 
                  ...prev, 
                  forceUpdate: e.target.checked 
                }))}
                className="mr-2"
                disabled={syncing}
              />
              <label htmlFor="force-update" className="text-sm text-gray-700">
                Force update all products (ignore timestamps)
              </label>
            </div>
          </div>

          {/* Sync Button */}
          <button
            onClick={handleTriggerSync}
            disabled={syncing || !onTriggerSync}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? 'Syncing...' : 'Start Sync'}
          </button>

          {/* Sync Progress */}
          {syncing && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-blue-800">Synchronizing products...</span>
              </div>
            </div>
          )}

          {/* Last Sync Result */}
          {lastSyncResult && (
            <div className={`mt-4 p-3 border rounded-md ${
              lastSyncResult.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className={`text-sm ${
                lastSyncResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                <strong>
                  {lastSyncResult.success ? 'Sync completed successfully' : 'Sync failed'}
                </strong>
                <div className="mt-1">
                  {lastSyncResult.success ? (
                    formatSyncResult(lastSyncResult)
                  ) : (
                    lastSyncResult.errors.join(', ')
                  )}
                </div>
                <div className="text-xs mt-1 opacity-75">
                  Duration: {(lastSyncResult.duration / 1000).toFixed(1)}s
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sync History */}
      <CMSSyncHistory history={history} />
    </div>
  )
}