'use client'

import React, { useState, useEffect } from 'react'
import { CMSSyncDashboard } from '../../components/cms/CMSSyncDashboard'
import { SyncStatusInfo } from '../../lib/cms-fallback'
import { SyncResult } from '../../lib/cms-client'

export default function CMSManagementPage() {
  const [status, setStatus] = useState<SyncStatusInfo | null>(null)
  const [history, setHistory] = useState<SyncResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/cms/sync')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setStatus(data.status)
      setHistory(data.history || [])
    } catch (err) {
      console.error('Failed to load CMS data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleTriggerSync = async (options?: { category?: string; forceUpdate?: boolean }) => {
    const response = await fetch('/api/cms/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options || {})
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  const handleTestConnection = async () => {
    const response = await fetch('/api/cms/connection')
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      success: data.connection.success,
      status: data.connection.status,
      responseTime: data.connection.responseTime
    }
  }

  const handleRefreshStatus = async () => {
    const response = await fetch('/api/cms/sync')
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.status
  }

  const handleRefreshHistory = async () => {
    const response = await fetch('/api/cms/sync')
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.history || []
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading CMS dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load CMS Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CMSSyncDashboard
        initialStatus={status || undefined}
        initialHistory={history}
        onTriggerSync={handleTriggerSync}
        onTestConnection={handleTestConnection}
        onRefreshStatus={handleRefreshStatus}
        onRefreshHistory={handleRefreshHistory}
      />
    </div>
  )
}