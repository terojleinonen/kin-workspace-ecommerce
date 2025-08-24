import { Order, OrderStatus, PaymentStatus } from './types'

export function getOrderStatusColor(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800'
    case OrderStatus.CONFIRMED:
      return 'bg-blue-100 text-blue-800'
    case OrderStatus.PROCESSING:
      return 'bg-purple-100 text-purple-800'
    case OrderStatus.SHIPPED:
      return 'bg-indigo-100 text-indigo-800'
    case OrderStatus.DELIVERED:
      return 'bg-green-100 text-green-800'
    case OrderStatus.CANCELLED:
      return 'bg-red-100 text-red-800'
    case OrderStatus.REFUNDED:
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getPaymentStatusColor(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800'
    case PaymentStatus.PAID:
      return 'bg-green-100 text-green-800'
    case PaymentStatus.FAILED:
      return 'bg-red-100 text-red-800'
    case PaymentStatus.REFUNDED:
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function formatOrderId(orderId: string): string {
  // Format order ID for display (e.g., "ORDER-1234")
  return `ORDER-${orderId.slice(-8).toUpperCase()}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(dateString))
}

export function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString))
}

export function getOrderStatusSteps(status: OrderStatus): Array<{
  status: OrderStatus
  label: string
  completed: boolean
  current: boolean
}> {
  const steps = [
    { status: OrderStatus.PENDING, label: 'Order Placed' },
    { status: OrderStatus.CONFIRMED, label: 'Confirmed' },
    { status: OrderStatus.PROCESSING, label: 'Processing' },
    { status: OrderStatus.SHIPPED, label: 'Shipped' },
    { status: OrderStatus.DELIVERED, label: 'Delivered' }
  ]

  const statusOrder = [
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED
  ]

  const currentIndex = statusOrder.indexOf(status)
  
  return steps.map((step, index) => ({
    ...step,
    completed: index < currentIndex,
    current: index === currentIndex
  }))
}

export function canCancelOrder(order: Order): boolean {
  return [
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.PROCESSING
  ].includes(order.status)
}

export function canReorder(order: Order): boolean {
  return order.status !== OrderStatus.CANCELLED
}

export function getOrderItemsCount(order: Order): number {
  return order.items.reduce((total, item) => total + item.quantity, 0)
}

export function searchOrders(orders: Order[], searchTerm: string): Order[] {
  if (!searchTerm.trim()) return orders

  const term = searchTerm.toLowerCase()
  
  return orders.filter(order => 
    order.id.toLowerCase().includes(term) ||
    formatOrderId(order.id).toLowerCase().includes(term) ||
    order.items.some(item => 
      item.product.name.toLowerCase().includes(term)
    )
  )
}

export function filterOrdersByStatus(orders: Order[], statuses: OrderStatus[]): Order[] {
  if (!statuses.length) return orders
  return orders.filter(order => statuses.includes(order.status))
}

export function filterOrdersByDateRange(
  orders: Order[], 
  startDate?: string, 
  endDate?: string
): Order[] {
  if (!startDate && !endDate) return orders

  return orders.filter(order => {
    const orderDate = new Date(order.createdAt)
    
    if (startDate && orderDate < new Date(startDate)) return false
    if (endDate && orderDate > new Date(endDate)) return false
    
    return true
  })
}

export function sortOrders(
  orders: Order[], 
  sortBy: 'date' | 'total' | 'status', 
  sortOrder: 'asc' | 'desc' = 'desc'
): Order[] {
  return [...orders].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'date':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      case 'total':
        comparison = a.total - b.total
        break
      case 'status':
        comparison = a.status.localeCompare(b.status)
        break
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })
}