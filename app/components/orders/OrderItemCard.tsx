'use client'

import Image from 'next/image'
import Link from 'next/link'
import { OrderItem } from '@/app/lib/types'
import { formatCurrency } from '@/app/lib/order-utils'

interface OrderItemCardProps {
  item: OrderItem
}

export default function OrderItemCard({ item }: OrderItemCardProps) {
  const { product, quantity, price } = item
  const totalPrice = price * quantity

  return (
    <div className="flex items-center gap-4 p-4 border border-warm-beige rounded-lg">
      <div className="w-20 h-20 rounded-lg overflow-hidden bg-warm-beige flex-shrink-0">
        <Image
          src={product.image}
          alt={product.name}
          width={80}
          height={80}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <Link
          href={`/product/${product.slug}`}
          className="font-satoshi font-semibold text-matte-black hover:text-slate-gray transition-colors block truncate"
        >
          {product.name}
        </Link>
        
        {item.variant && (
          <div className="text-sm text-slate-gray mt-1">
            {item.variant.color && (
              <span>Color: {item.variant.color}</span>
            )}
            {item.variant.size && (
              <span className={item.variant.color ? 'ml-3' : ''}>
                Size: {item.variant.size}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <div className="text-sm text-slate-gray">
            Qty: {quantity} × {formatCurrency(price)}
          </div>
          <div className="font-satoshi font-semibold text-matte-black">
            {formatCurrency(totalPrice)}
          </div>
        </div>
      </div>
    </div>
  )
}