'use client'

import { Order } from '@/app/lib/types'
import { formatCurrency, getPaymentStatusColor } from '@/app/lib/order-utils'

interface OrderSummaryProps {
  order: Order
}

export default function OrderSummary({ order }: OrderSummaryProps) {
  const paymentStatusColor = getPaymentStatusColor(order.paymentStatus)

  return (
    <div className="bg-white rounded-lg border border-warm-beige p-6">
      <h3 className="font-satoshi font-semibold text-lg text-matte-black mb-6">
        Order Summary
      </h3>

      <div className="space-y-3">
        <div className="flex justify-between text-slate-gray">
          <span>Subtotal</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        
        <div className="flex justify-between text-slate-gray">
          <span>Shipping</span>
          <span>{formatCurrency(order.shipping)}</span>
        </div>
        
        <div className="flex justify-between text-slate-gray">
          <span>Tax</span>
          <span>{formatCurrency(order.tax)}</span>
        </div>
        
        <div className="border-t border-warm-beige pt-3">
          <div className="flex justify-between font-satoshi font-semibold text-lg text-matte-black">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-warm-beige">
        <h4 className="font-satoshi font-semibold text-matte-black mb-3">
          Payment Information
        </h4>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-gray">Payment Method</span>
            <span className="text-matte-black capitalize">
              {order.paymentMethod.replace('demo-', '').replace('-', ' ')}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-slate-gray">Payment Status</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColor}`}>
              {order.paymentStatus.charAt(0) + order.paymentStatus.slice(1).toLowerCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}