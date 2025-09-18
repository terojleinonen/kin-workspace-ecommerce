'use client'

import React, { useState, useMemo } from 'react'
import { SyncResult } from '../../lib/cms-client'

interface CMSSyncHistoryProps {
  history: SyncResult[]
  itemsPerPage?: number
}

type FilterStatus = 'all' | 'success' | 'failed'

export function CMSSyncHistory({ history, itemsPerPage = 10 }: CMSSyncHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  const filteredHistory = useMemo(() => {
    if (filterStatus === 'all') return history
    return history.filter(item => 
      filterStatus === 'success' ? item.success : !item.success
    )
  }, [history, filterStatus])

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedHistory = filteredHistory.slice(startIndex, startIndex + itemsPerPage)

  const formatDuration = (duration: number) => {
    return `${(duration / 1000).toFixed(1)}s`
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const formatSyncSummary = (item: SyncResult) => {
    const parts = []
    if (item.productsUpdated > 0) parts.push(`${item.productsUpdated} updated`)
    if (item.productsAdded > 0) parts.push(`${item.productsAdded} added`)
    if (item.productsRemoved > 0) parts.push(`${item.productsRemoved} removed`)
    
    return parts.length > 0 ? parts.join(', ') : 'No changes'
  }

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync History</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-500">No sync history available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Sync History</h3>
        
        <div className="flex items-center space-x-2">
          <label htmlFor="status-filter" className="text-sm text-gray-600">
            Filter by status:
          </label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as FilterStatus)
              setCurrentPage(1)
            }}
            className="text-sm border border-gray-300 rounded-md px-2 py-1"
          >
            <option value="all">All</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {paginatedHistory.map((item, index) => (
          <div
            key={startIndex + index}
            className={`p-4 border rounded-lg ${
              item.success 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  item.success ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className={`font-medium ${
                  item.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {item.success ? 'Success' : 'Failed'}
                </span>
                <span className="text-sm text-gray-600">
                  {formatDate(item.lastSync)}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {formatDuration(item.duration)}
              </span>
            </div>

            <div className="text-sm text-gray-700 mb-2">
              {formatSyncSummary(item)}
            </div>

            {item.errors.length > 0 && (
              <div className="text-sm text-red-700">
                <strong>Errors:</strong>
                <ul className="list-disc list-inside mt-1">
                  {item.errors.map((error, errorIndex) => (
                    <li key={errorIndex}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}