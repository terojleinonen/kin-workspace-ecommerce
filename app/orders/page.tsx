'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'
import { Order, OrderFilters as OrderFiltersType, OrdersResponse } from '@/app/lib/types'
import OrderCard from '@/app/components/orders/OrderCard'
import OrderFilters from '@/app/components/orders/OrderFilters'
import OrderPagination from '@/app/components/orders/OrderPagination'

export default function OrdersPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<OrderFiltersType>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      })

      // Add filters to params
      if (filters.status?.length) {
        filters.status.forEach(status => params.append('status', status))
      }
      if (filters.startDate) params.set('startDate', filters.startDate)
      if (filters.endDate) params.set('endDate', filters.endDate)
      if (searchTerm) params.set('search', searchTerm)
      if (filters.sortBy) params.set('sortBy', filters.sortBy)
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder)

      const response = await fetch(`/api/orders?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data: OrdersResponse = await response.json()
      setOrders(data.orders)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders(1)
    }
  }, [isAuthenticated, filters, searchTerm])

  const handleFiltersChange = (newFilters: OrderFiltersType) => {
    setFilters(newFilters)
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const handlePageChange = (page: number) => {
    fetchOrders(page)
  }

  if (isLoading && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-matte-black"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-soft-white pt-20">
      <div className="max-w-site mx-auto px-6 py-section-mobile md:py-section">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-satoshi font-bold text-3xl text-matte-black mb-8">
            Order History
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <OrderFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onSearch={handleSearch}
          />

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-matte-black"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-lg border border-warm-beige p-8 text-center">
              <div className="max-w-md mx-auto">
                <h2 className="font-satoshi font-semibold text-xl text-matte-black mb-4">
                  {searchTerm || Object.keys(filters).length > 0 ? 'No Orders Found' : 'No Orders Yet'}
                </h2>
                <p className="text-slate-gray mb-6">
                  {searchTerm || Object.keys(filters).length > 0
                    ? 'Try adjusting your search or filters to find what you\'re looking for.'
                    : 'You haven\'t placed any orders yet. Start shopping to see your order history here.'
                  }
                </p>
                {!searchTerm && Object.keys(filters).length === 0 && (
                  <button
                    onClick={() => router.push('/shop')}
                    className="bg-matte-black text-soft-white px-6 py-3 rounded-lg hover:bg-slate-gray transition-colors"
                  >
                    Start Shopping
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-6 mb-8">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>

              <OrderPagination
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}