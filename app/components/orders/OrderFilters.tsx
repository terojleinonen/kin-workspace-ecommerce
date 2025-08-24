'use client'

import { useState } from 'react'
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { OrderStatus, OrderFilters as OrderFiltersType } from '@/app/lib/types'

interface OrderFiltersProps {
  filters: OrderFiltersType
  onFiltersChange: (filters: OrderFiltersType) => void
  onSearch: (searchTerm: string) => void
}

export default function OrderFilters({ filters, onFiltersChange, onSearch }: OrderFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchTerm)
  }

  const handleStatusChange = (status: OrderStatus, checked: boolean) => {
    const currentStatuses = filters.status || []
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter(s => s !== status)
    
    onFiltersChange({ ...filters, status: newStatuses })
  }

  const handleSortChange = (sortBy: string, sortOrder: string) => {
    onFiltersChange({ 
      ...filters, 
      sortBy: sortBy as 'date' | 'total' | 'status',
      sortOrder: sortOrder as 'asc' | 'desc'
    })
  }

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    onFiltersChange({ ...filters, startDate, endDate })
  }

  const clearFilters = () => {
    onFiltersChange({})
    setSearchTerm('')
    onSearch('')
  }

  const hasActiveFilters = !!(
    filters.status?.length ||
    filters.startDate ||
    filters.endDate ||
    searchTerm
  )

  return (
    <div className="bg-white rounded-lg border border-warm-beige p-6 mb-6">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="mb-4">
        <label htmlFor="order-search" className="sr-only">
          Search orders by ID or product name
        </label>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-gray" />
          <input
            id="order-search"
            type="text"
            placeholder="Search by order ID or product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-warm-beige rounded-lg focus:outline-none focus:ring-2 focus:ring-matte-black focus:border-transparent"
          />
        </div>
      </form>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
          aria-controls="order-filters"
          className="flex items-center gap-2 text-matte-black hover:text-slate-gray transition-colors"
        >
          <FunnelIcon className="h-5 w-5" />
          <span className="font-medium">Filters</span>
          {hasActiveFilters && (
            <span className="bg-matte-black text-white text-xs px-2 py-1 rounded-full">
              Active
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            aria-label="Clear all filters"
            className="flex items-center gap-1 text-slate-gray hover:text-matte-black transition-colors text-sm"
          >
            <XMarkIcon className="h-4 w-4" />
            Clear all
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div id="order-filters" className="mt-6 pt-6 border-t border-warm-beige">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status Filter */}
            <div>
              <h4 className="font-satoshi font-semibold text-matte-black mb-3">Order Status</h4>
              <div className="space-y-2" role="group" aria-labelledby="status-filter-heading">
                <span id="status-filter-heading" className="sr-only">Filter by order status</span>
                {Object.values(OrderStatus).map((status) => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.status?.includes(status) || false}
                      onChange={(e) => handleStatusChange(status, e.target.checked)}
                      className="rounded border-warm-beige text-matte-black focus:ring-matte-black"
                      aria-describedby={`status-${status}-desc`}
                    />
                    <span id={`status-${status}-desc`} className="ml-2 text-sm text-slate-gray">
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <h4 className="font-satoshi font-semibold text-matte-black mb-3">Date Range</h4>
              <div className="space-y-3">
                <div>
                  <label htmlFor="start-date" className="block text-sm text-slate-gray mb-1">From</label>
                  <input
                    id="start-date"
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => handleDateRangeChange(e.target.value, filters.endDate || '')}
                    aria-label="Start date for order filter"
                    className="w-full px-3 py-2 border border-warm-beige rounded-lg focus:outline-none focus:ring-2 focus:ring-matte-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-sm text-slate-gray mb-1">To</label>
                  <input
                    id="end-date"
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => handleDateRangeChange(filters.startDate || '', e.target.value)}
                    aria-label="End date for order filter"
                    className="w-full px-3 py-2 border border-warm-beige rounded-lg focus:outline-none focus:ring-2 focus:ring-matte-black focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <h4 className="font-satoshi font-semibold text-matte-black mb-3">Sort By</h4>
              <div className="space-y-3">
                <div>
                  <label htmlFor="sort-by" className="sr-only">Sort orders by</label>
                  <select
                    id="sort-by"
                    value={filters.sortBy || 'date'}
                    onChange={(e) => handleSortChange(e.target.value, filters.sortOrder || 'desc')}
                    aria-label="Sort orders by field"
                    className="w-full px-3 py-2 border border-warm-beige rounded-lg focus:outline-none focus:ring-2 focus:ring-matte-black focus:border-transparent"
                  >
                    <option value="date">Date</option>
                    <option value="total">Total Amount</option>
                    <option value="status">Status</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="sort-order" className="sr-only">Sort order direction</label>
                  <select
                    id="sort-order"
                    value={filters.sortOrder || 'desc'}
                    onChange={(e) => handleSortChange(filters.sortBy || 'date', e.target.value)}
                    aria-label="Sort order direction"
                    className="w-full px-3 py-2 border border-warm-beige rounded-lg focus:outline-none focus:ring-2 focus:ring-matte-black focus:border-transparent"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}