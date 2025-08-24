import { OrderStatus, Order } from './types'

export interface DemoOrderConfig {
  autoAdvanceEnabled: boolean
  advancementDelayMs: number
  statusProgression: OrderStatus[]
}

export class DemoOrderService {
  private static instance: DemoOrderService
  private config: DemoOrderConfig
  private activeTimers: Map<string, NodeJS.Timeout> = new Map()

  private constructor() {
    this.config = {
      autoAdvanceEnabled: process.env.NODE_ENV === 'development',
      advancementDelayMs: 30000, // 30 seconds for demo
      statusProgression: [
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PROCESSING,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED
      ]
    }
  }

  static getInstance(): DemoOrderService {
    if (!DemoOrderService.instance) {
      DemoOrderService.instance = new DemoOrderService()
    }
    return DemoOrderService.instance
  }

  /**
   * Start auto-advancement for a demo order
   */
  startAutoAdvancement(order: Order): void {
    if (!this.config.autoAdvanceEnabled) return
    if (order.paymentMethod && !order.paymentMethod.startsWith('demo-')) return

    // Clear any existing timer for this order
    this.stopAutoAdvancement(order.id)

    const currentIndex = this.config.statusProgression.indexOf(order.status)
    if (currentIndex === -1 || currentIndex >= this.config.statusProgression.length - 1) {
      return // Order is at final status or invalid status
    }

    const nextStatus = this.config.statusProgression[currentIndex + 1]
    
    const timer = setTimeout(async () => {
      try {
        await this.advanceOrderStatus(order.id, nextStatus)
      } catch (error) {
        console.error('Failed to auto-advance order status:', error)
      }
    }, this.config.advancementDelayMs)

    this.activeTimers.set(order.id, timer)
  }

  /**
   * Stop auto-advancement for an order
   */
  stopAutoAdvancement(orderId: string): void {
    const timer = this.activeTimers.get(orderId)
    if (timer) {
      clearTimeout(timer)
      this.activeTimers.delete(orderId)
    }
  }

  /**
   * Advance order status and continue auto-advancement
   */
  private async advanceOrderStatus(orderId: string, nextStatus: OrderStatus): Promise<void> {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: nextStatus,
          note: 'Auto-advanced for demo purposes'
        })
      })

      if (response.ok) {
        const updatedOrder = await response.json()
        
        // Continue auto-advancement if not at final status
        if (nextStatus !== OrderStatus.DELIVERED) {
          this.startAutoAdvancement(updatedOrder)
        }

        // Emit event for UI updates (if needed)
        this.emitOrderStatusUpdate(updatedOrder)
      }
    } catch (error) {
      console.error('Error advancing order status:', error)
    }
  }

  /**
   * Emit order status update event
   */
  private emitOrderStatusUpdate(order: Order): void {
    // In a real app, this could use WebSockets or Server-Sent Events
    // For demo purposes, we'll use a custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orderStatusUpdate', {
        detail: { order }
      }))
    }
  }

  /**
   * Get next status in progression
   */
  getNextStatus(currentStatus: OrderStatus): OrderStatus | null {
    const currentIndex = this.config.statusProgression.indexOf(currentStatus)
    if (currentIndex === -1 || currentIndex >= this.config.statusProgression.length - 1) {
      return null
    }
    return this.config.statusProgression[currentIndex + 1]
  }

  /**
   * Check if status can be advanced
   */
  canAdvanceStatus(currentStatus: OrderStatus): boolean {
    return this.getNextStatus(currentStatus) !== null
  }

  /**
   * Get estimated time for next status update
   */
  getEstimatedNextUpdate(orderId: string): Date | null {
    if (!this.activeTimers.has(orderId)) return null
    
    return new Date(Date.now() + this.config.advancementDelayMs)
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DemoOrderConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): DemoOrderConfig {
    return { ...this.config }
  }

  /**
   * Cleanup all timers
   */
  cleanup(): void {
    this.activeTimers.forEach(timer => clearTimeout(timer))
    this.activeTimers.clear()
  }
}

// Export singleton instance
export const demoOrderService = DemoOrderService.getInstance()

// Cleanup on process exit (for server-side)
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    demoOrderService.cleanup()
  })
}