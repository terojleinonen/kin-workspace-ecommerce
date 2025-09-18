'use client'

import { useState } from 'react'
import { useDemoMode } from '@/app/contexts/DemoModeContext'
import { ArrowPathIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'

interface DemoDataStats {
  users: number
  orders: number
  reviews: number
  lastReset?: string
}

export default function DemoDataManager() {
  const { isDemoMode, isResetting, resetDemoData } = useDemoMode()
  const [isGenerating, setIsGenerating] = useState(false)
  const [stats, setStats] = useState<DemoDataStats>({
    users: 0,
    orders: 0,
    reviews: 0
  })

  if (!isDemoMode) {
    return null
  }

  const handleResetData = async () => {
    if (confirm('Are you sure you want to reset all demo data? This will delete all demo orders, reviews, and users (except admin).')) {
      await resetDemoData()
    }
  }

  const handleGenerateData = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/demo/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userCount: 5,
          orderCount: 10,
          reviewCount: 15
        })
      })

      if (response.ok) {
        const result = await response.json()
        setStats(result.data)
        alert('Demo data generated successfully!')
      } else {
        throw new Error('Failed to generate demo data')
      }
    } catch (error) {
      console.error('Error generating demo data:', error)
      alert('Failed to generate demo data. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/demo/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching demo stats:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-warm-beige p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-satoshi font-bold text-xl text-matte-black">
            Demo Data Management
          </h3>
          <p className="text-slate-gray text-sm mt-1">
            Manage demo data for testing and demonstration purposes
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white">
            🎭 DEMO MODE
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-blue-600 text-sm font-medium">Demo Users</div>
          <div className="text-blue-900 text-2xl font-bold">{stats.users}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-600 text-sm font-medium">Demo Orders</div>
          <div className="text-green-900 text-2xl font-bold">{stats.orders}</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-purple-600 text-sm font-medium">Demo Reviews</div>
          <div className="text-purple-900 text-2xl font-bold">{stats.reviews}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleGenerateData}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
            ) : (
              <PlusIcon className="h-5 w-5" />
            )}
            <span>{isGenerating ? 'Generating...' : 'Generate Demo Data'}</span>
          </button>

          <button
            onClick={fetchStats}
            className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowPathIcon className="h-5 w-5" />
            <span>Refresh Stats</span>
          </button>

          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="flex-1 flex items-center justify-center space-x-2 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isResetting ? (
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
            ) : (
              <TrashIcon className="h-5 w-5" />
            )}
            <span>{isResetting ? 'Resetting...' : 'Reset All Data'}</span>
          </button>
        </div>

        {stats.lastReset && (
          <div className="text-sm text-slate-gray">
            Last reset: {new Date(stats.lastReset).toLocaleString()}
          </div>
        )}
      </div>

      {/* Demo Scenarios */}
      <div className="mt-6 pt-6 border-t border-warm-beige">
        <h4 className="font-satoshi font-semibold text-matte-black mb-3">
          Demo Scenarios
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-warm-beige/20 rounded-lg p-3">
            <div className="font-medium text-matte-black text-sm">Customer Journey</div>
            <div className="text-slate-gray text-xs mt-1">
              Complete shopping experience from browsing to order completion
            </div>
          </div>
          <div className="bg-warm-beige/20 rounded-lg p-3">
            <div className="font-medium text-matte-black text-sm">Order Management</div>
            <div className="text-slate-gray text-xs mt-1">
              View orders in different statuses and track progress
            </div>
          </div>
          <div className="bg-warm-beige/20 rounded-lg p-3">
            <div className="font-medium text-matte-black text-sm">Review System</div>
            <div className="text-slate-gray text-xs mt-1">
              Product reviews with ratings and helpful votes
            </div>
          </div>
          <div className="bg-warm-beige/20 rounded-lg p-3">
            <div className="font-medium text-matte-black text-sm">Payment Processing</div>
            <div className="text-slate-gray text-xs mt-1">
              Demo payment flows with success and failure scenarios
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}