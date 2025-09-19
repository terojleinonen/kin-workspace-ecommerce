'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/app/contexts/AuthContext'
import { Order } from '@/app/lib/types'
import { formatOrderId, formatDate } from '@/app/lib/order-utils'
import OrderItemCard from '@/app/components/orders/OrderItemCard'
import OrderStatusTimeline from '@/app/components/orders/OrderStatusTimeline'
import AddressCard from '@/app/components/orders/AddressCard'
import OrderSummary from '@/app/components/orders/OrderSummary'
import OrderActions from '@/app/components/orders/OrderActions'

interface OrderDetailsPageProps {
  params: Promise<{ orderId: string }>
}

export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    params.then(({ orderId }) => {
      setOrderId(orderId)
    })
  }, [params])

  const fetchOrder = async (orderIdParam: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/orders/${orderIdParam}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Order not found')
        } else {
          throw new Error('Failed to fetch order')
        }
        return
      }

      const orderData = await response.json()
      setOrder(orderData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && orderId) {
      fetchOrder(orderId)
    }
  }, [isAuthenticated, orderId])

  const handleOrderUpdate = (updatedOrder: Order) => {
    setOrder(updatedOrder)
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

  if (error) {
    return (
      <div className="min-h-screen bg-soft-white pt-20">
        <div className="max-w-site mx-auto px-6 py-section-mobile md:py-section">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 text-slate-gray hover:text-matte-black transition-colors mb-6"
            >
              <ChevronLeftIcon className="h-5 w-5" />
              Back to Orders
            </Link>

            <div className="bg-white rounded-lg border border-warm-beige p-8 text-center">
              <h1 className="font-satoshi font-bold text-2xl text-matte-black mb-4">
                {error}
              </h1>
              <p className="text-slate-gray mb-6">
                The order you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Link
                href="/orders"
                className="bg-matte-black text-soft-white px-6 py-3 rounded-lg hover:bg-slate-gray transition-colors"
              >
                View All Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-soft-white pt-20">
        <div className="max-w-site mx-auto px-6 py-section-mobile md:py-section">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-matte-black"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-soft-white pt-20">
      <div className="max-w-site mx-auto px-6 py-section-mobile md:py-section">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 text-slate-gray hover:text-matte-black transition-colors mb-4"
            >
              <ChevronLeftIcon className="h-5 w-5" />
              Back to Orders
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="font-satoshi font-bold text-3xl text-matte-black">
                  {formatOrderId(order.id)}
                </h1>
                <p className="text-slate-gray">
                  Placed on {formatDate(order.createdAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Order Items */}
              <div className="bg-white rounded-lg border border-warm-beige p-6">
                <h2 className="font-satoshi font-semibold text-xl text-matte-black mb-6">
                  Order Items ({order.items.length})
                </h2>
                
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <OrderItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>

              {/* Status Timeline */}
              <OrderStatusTimeline
                order={order}
                onStatusUpdate={handleOrderUpdate}
              />

              {/* Addresses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AddressCard
                  title="Shipping Address"
                  address={order.shippingAddress}
                />
                <AddressCard
                  title="Billing Address"
                  address={order.billingAddress}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <OrderSummary order={order} />
              <OrderActions order={order} onOrderUpdate={handleOrderUpdate} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}