'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Order } from '@/app/lib/types'
import { canCancelOrder, canReorder } from '@/app/lib/order-utils'
import { useCart } from '@/app/contexts/CartContext'

interface OrderActionsProps {
  order: Order
  onOrderUpdate?: (updatedOrder: Order) => void
}

export default function OrderActions({ order, onOrderUpdate }: OrderActionsProps) {
  const router = useRouter()
  const { addToCart } = useCart()
  const [loading, setLoading] = useState(false)

  const handleReorder = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/orders/${order.id}/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process reorder')
      }

      const result = await response.json()
      
      // Add items to cart
      result.cartItems.forEach((cartItem: any) => {
        addToCart(cartItem.product, cartItem.quantity, cartItem.variant)
      })

      // Show message if some items are unavailable
      if (result.unavailableItems && result.unavailableItems.length > 0) {
        alert(`${result.message}. Available items have been added to your cart.`)
      }

      // Navigate to cart
      router.push('/cart')
    } catch (error) {
      console.error('Error reordering:', error)
      alert(error instanceof Error ? error.message : 'Failed to reorder items. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Customer requested cancellation' })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cancel order')
      }

      const result = await response.json()
      onOrderUpdate?.(result.order)
      alert(result.message || 'Order cancelled successfully')
    } catch (error) {
      console.error('Error cancelling order:', error)
      alert(error instanceof Error ? error.message : 'Failed to cancel order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePrintReceipt = () => {
    window.print()
  }

  return (
    <div className="bg-white rounded-lg border border-warm-beige p-6">
      <h3 className="font-satoshi font-semibold text-lg text-matte-black mb-6">
        Order Actions
      </h3>

      <div className="space-y-3">
        {canReorder(order) && (
          <button
            onClick={handleReorder}
            disabled={loading}
            className="w-full bg-matte-black text-soft-white py-3 px-4 rounded-lg hover:bg-slate-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Adding to Cart...' : 'Reorder Items'}
          </button>
        )}

        <button
          onClick={handlePrintReceipt}
          className="w-full border border-warm-beige text-matte-black py-3 px-4 rounded-lg hover:bg-warm-beige transition-colors font-medium"
        >
          Print Receipt
        </button>

        {canCancelOrder(order) && (
          <button
            onClick={handleCancelOrder}
            disabled={loading}
            className="w-full border border-red-300 text-red-600 py-3 px-4 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-warm-beige">
        <p className="text-sm text-slate-gray">
          Need help with your order?{' '}
          <a href="/support" className="text-matte-black hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  )
}