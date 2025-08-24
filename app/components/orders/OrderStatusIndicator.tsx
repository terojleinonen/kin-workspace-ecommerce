'use client'

import { useEffect, useState } from 'react'
import { CheckIcon, ClockIcon, TruckIcon, HomeIcon } from '@heroicons/react/24/solid'
import { OrderStatus, Order } from '@/app/lib/types'
import { getOrderStatusColor } from '@/app/lib/order-utils'
import { demoOrderService } from '@/app/lib/demo-order-service'

interface OrderStatusIndicatorProps {
  order: Order
  showProgress?: boolean
  onStatusUpdate?: (order: Order) => void
}

export default function OrderStatusIndicator({ 
  order, 
  showProgress = false,
  onStatusUpdate 
}: OrderStatusIndicatorProps) {
  const [currentOrder, setCurrentOrder] = useState(order)
  const [nextUpdateTime, setNextUpdateTime] = useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>('')

  useEffect(() => {
    setCurrentOrder(order)
    
    // Start auto-advancement for demo orders
    if (order.paymentMethod?.startsWith('demo-')) {
      demoOrderService.startAutoAdvancement(order)
      setNextUpdateTime(demoOrderService.getEstimatedNextUpdate(order.id))
    }

    // Listen for order status updates
    const handleStatusUpdate = (event: CustomEvent) => {
      const updatedOrder = event.detail.order
      if (updatedOrder.id === order.id) {
        setCurrentOrder(updatedOrder)
        onStatusUpdate?.(updatedOrder)
        setNextUpdateTime(demoOrderService.getEstimatedNextUpdate(updatedOrder.id))
      }
    }

    window.addEventListener('orderStatusUpdate', handleStatusUpdate as EventListener)

    return () => {
      window.removeEventListener('orderStatusUpdate', handleStatusUpdate as EventListener)
      demoOrderService.stopAutoAdvancement(order.id)
    }
  }, [order.id, order.paymentMethod, onStatusUpdate])

  // Update countdown timer
  useEffect(() => {
    if (!nextUpdateTime) return

    const interval = setInterval(() => {
      const now = new Date()
      const diff = nextUpdateTime.getTime() - now.getTime()
      
      if (diff <= 0) {
        setTimeRemaining('')
        setNextUpdateTime(null)
        return
      }

      const seconds = Math.floor(diff / 1000)
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60

      if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${remainingSeconds}s`)
      } else {
        setTimeRemaining(`${remainingSeconds}s`)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [nextUpdateTime])

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
      case OrderStatus.CONFIRMED:
        return <ClockIcon className="w-5 h-5" />
      case OrderStatus.PROCESSING:
        return <div className="w-3 h-3 rounded-full bg-current animate-pulse" />
      case OrderStatus.SHIPPED:
        return <TruckIcon className="w-5 h-5" />
      case OrderStatus.DELIVERED:
        return <HomeIcon className="w-5 h-5" />
      case OrderStatus.CANCELLED:
      case OrderStatus.REFUNDED:
        return <div className="w-3 h-3 rounded-full bg-current" />
      default:
        return <CheckIcon className="w-5 h-5" />
    }
  }

  const statusColor = getOrderStatusColor(currentOrder.status)
  const isDemoOrder = currentOrder.paymentMethod?.startsWith('demo-')
  const canAdvance = demoOrderService.canAdvanceStatus(currentOrder.status)

  return (
    <div className="flex items-center gap-3">
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
        {getStatusIcon(currentOrder.status)}
        <span>{currentOrder.status.charAt(0) + currentOrder.status.slice(1).toLowerCase()}</span>
      </div>

      {isDemoOrder && canAdvance && timeRemaining && (
        <div className="flex items-center gap-2 text-xs text-slate-gray">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>Next update in {timeRemaining}</span>
        </div>
      )}

      {isDemoOrder && (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
          DEMO
        </span>
      )}

      {showProgress && (
        <div className="flex-1 ml-4">
          <OrderStatusProgress status={currentOrder.status} />
        </div>
      )}
    </div>
  )
}

function OrderStatusProgress({ status }: { status: OrderStatus }) {
  const steps = [
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED
  ]

  const currentIndex = steps.indexOf(status)
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / steps.length) * 100 : 0

  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-green-500 h-2 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}