'use client'

import { useEffect, useState } from 'react'
import { CheckIcon, ClockIcon } from '@heroicons/react/24/solid'
import { OrderStatus, Order } from '@/app/lib/types'
import { getOrderStatusSteps, formatDateTime } from '@/app/lib/order-utils'
import { demoOrderService } from '@/app/lib/demo-order-service'

interface OrderStatusTimelineProps {
  order: Order
  onStatusUpdate?: (order: Order) => void
}

export default function OrderStatusTimeline({ order, onStatusUpdate }: OrderStatusTimelineProps) {
  const [currentOrder, setCurrentOrder] = useState(order)
  const [nextUpdateTime, setNextUpdateTime] = useState<Date | null>(null)
  const steps = getOrderStatusSteps(currentOrder.status)

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

  // For demo purposes, we'll simulate timestamps for each step
  const getStepTimestamp = (stepStatus: OrderStatus, index: number) => {
    if (stepStatus === OrderStatus.PENDING) {
      return currentOrder.createdAt
    }
    
    // Simulate progression timestamps
    const baseTime = new Date(currentOrder.createdAt).getTime()
    const stepDelayMs = 30000 // 30 seconds between steps for demo
    const simulatedTime = new Date(baseTime + (index * stepDelayMs))
    
    return simulatedTime.toISOString()
  }

  const isDemoOrder = currentOrder.paymentMethod?.startsWith('demo-')
  const canAdvance = demoOrderService.canAdvanceStatus(currentOrder.status)

  return (
    <div className="bg-white rounded-lg border border-warm-beige p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-satoshi font-semibold text-lg text-matte-black">
          Order Status
        </h3>
        
        {isDemoOrder && (
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              DEMO MODE
            </span>
            {canAdvance && nextUpdateTime && (
              <span className="text-xs text-slate-gray">
                Auto-advancing
              </span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4 relative">
        {steps.map((step, index) => (
          <div key={step.status} className="flex items-start gap-4 relative">
            {/* Status Icon */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10 ${
              step.completed 
                ? 'bg-green-100 text-green-600' 
                : step.current 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-gray-100 text-gray-400'
            }`}>
              {step.completed ? (
                <CheckIcon className="w-5 h-5" />
              ) : step.current ? (
                <ClockIcon className={`w-5 h-5 ${isDemoOrder && canAdvance ? 'animate-pulse' : ''}`} />
              ) : (
                <div className="w-3 h-3 rounded-full bg-current" />
              )}
            </div>

            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <div 
                className={`absolute left-4 top-8 w-0.5 h-8 ${
                  step.completed ? 'bg-green-200' : 'bg-gray-200'
                }`}
              />
            )}

            {/* Status Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className={`font-medium ${
                  step.completed || step.current 
                    ? 'text-matte-black' 
                    : 'text-slate-gray'
                }`}>
                  {step.label}
                </h4>
                
                {(step.completed || step.current) && (
                  <span className="text-sm text-slate-gray">
                    {formatDateTime(
                      step.current ? currentOrder.updatedAt : getStepTimestamp(step.status, index)
                    )}
                  </span>
                )}
              </div>

              {step.current && (
                <div className="mt-1">
                  <p className="text-sm text-slate-gray">
                    Your order is currently being {step.label.toLowerCase()}
                  </p>
                  {isDemoOrder && canAdvance && (
                    <p className="text-xs text-blue-600 mt-1">
                      Status will auto-advance in demo mode
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isDemoOrder && (
        <div className="mt-6 pt-6 border-t border-warm-beige">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Demo Mode Features</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Order status automatically advances every 30 seconds</li>
              <li>• Real-time status updates without page refresh</li>
              <li>• Simulated order progression for demonstration</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}