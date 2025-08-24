'use client'

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { OrderPagination as PaginationType } from '@/app/lib/types'

interface OrderPaginationProps {
  pagination: PaginationType
  onPageChange: (page: number) => void
}

export default function OrderPagination({ pagination, onPageChange }: OrderPaginationProps) {
  const { page, totalPages, total, limit } = pagination

  if (totalPages <= 1) return null

  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      const start = Math.max(1, page - 2)
      const end = Math.min(totalPages, start + maxVisiblePages - 1)
      
      if (start > 1) {
        pages.push(1)
        if (start > 2) pages.push('...')
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  return (
    <div className="bg-white rounded-lg border border-warm-beige p-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Results Info */}
        <div className="text-sm text-slate-gray">
          Showing {startItem} to {endItem} of {total} orders
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-2">
          {/* Previous Button */}
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-gray border border-warm-beige rounded-lg hover:bg-warm-beige disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Previous
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((pageNum, index) => (
              <button
                key={index}
                onClick={() => typeof pageNum === 'number' ? onPageChange(pageNum) : undefined}
                disabled={pageNum === '...'}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pageNum === page
                    ? 'bg-matte-black text-white'
                    : pageNum === '...'
                    ? 'text-slate-gray cursor-default'
                    : 'text-slate-gray border border-warm-beige hover:bg-warm-beige'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-gray border border-warm-beige rounded-lg hover:bg-warm-beige disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}