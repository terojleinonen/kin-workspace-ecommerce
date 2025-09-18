'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Order } from '@/app/lib/types'
import { 
  formatOrderId, 
  formatCurrency, 
  formatDate, 
  getOrderItemsCount 
} from '@/app/lib/order-utils'
import OrderStatusIndicator from './OrderStatusIndicator'
import DemoBadge from '../DemoBadge'

interface OrderCardProps {
  order: Order
}

export default function OrderCard({ order }: OrderCardProps) {
  const itemsCount = getOrderItemsCount(order)

  return (
    <div className="bg-white rounded-lg border border-warm-beige p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="mb-2 sm:mb-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-satoshi font-semibold text-lg text-matte-black">
              {formatOrderId(order.id)}
            </h3>
            <DemoBadge variant="small" />
          </div>
          <p className="text-slate-gray text-sm">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusIndicator order={order} />
          <span className="font-satoshi font-semibold text-matte-black">
            {formatCurrency(order.total)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex -space-x-2">
          {order.items.slice(0, 3).map((item, index) => (
            <div
              key={item.id}
              className="w-12 h-12 rounded-lg border-2 border-white overflow-hidden bg-warm-beige"
              style={{ zIndex: 3 - index }}
            >
              <Image
                src={item.product.image}
                alt={item.product.name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {order.items.length > 3 && (
            <div className="w-12 h-12 rounded-lg border-2 border-white bg-slate-gray flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                +{order.items.length - 3}
              </span>
            </div>
          )}
        </div>
        <div className="text-slate-gray text-sm">
          {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={`/orders/${order.id}`}
          className="flex-1 bg-matte-black text-soft-white text-center py-2 px-4 rounded-lg hover:bg-slate-gray transition-colors text-sm font-medium"
        >
          View Details
        </Link>
        <button className="flex-1 border border-warm-beige text-matte-black py-2 px-4 rounded-lg hover:bg-warm-beige transition-colors text-sm font-medium">
          Reorder
        </button>
      </div>
    </div>
  )
}