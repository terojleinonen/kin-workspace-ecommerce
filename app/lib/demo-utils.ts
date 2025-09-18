/**
 * Demo mode utilities for consistent demo experience
 */

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}

export function getDemoModeConfig() {
  return {
    isDemoMode: isDemoMode(),
    successRate: parseFloat(process.env.DEMO_SUCCESS_RATE || '0.9'),
    processingDelay: parseInt(process.env.DEMO_PROCESSING_DELAY || '2000'),
    paymentMode: process.env.PAYMENT_MODE || 'demo'
  }
}

export function getDemoCardScenarios() {
  return [
    {
      name: 'Success Card',
      description: 'Always succeeds',
      cardNumber: '4111111111111111',
      expectedResult: 'success'
    },
    {
      name: 'Decline Card', 
      description: 'Always declines',
      cardNumber: '4000000000000002',
      expectedResult: 'decline'
    },
    {
      name: 'Insufficient Funds',
      description: 'Insufficient funds error',
      cardNumber: '4000000000009995',
      expectedResult: 'insufficient_funds'
    },
    {
      name: 'Lost Card',
      description: 'Lost card error',
      cardNumber: '4000000000009987',
      expectedResult: 'lost_card'
    }
  ]
}

export function getDemoUserAccounts() {
  return [
    {
      email: 'demo@kinworkspace.com',
      password: 'demo123',
      name: 'Demo User',
      role: 'customer'
    },
    {
      email: 'admin@kinworkspace.com', 
      password: 'admin123',
      name: 'Demo Admin',
      role: 'admin'
    }
  ]
}

export function getDemoOrderStatuses() {
  return [
    'pending',
    'confirmed', 
    'processing',
    'shipped',
    'delivered',
    'cancelled'
  ]
}

export function generateDemoOrderId(): string {
  const prefix = 'DEMO'
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

export function isDemoOrder(orderId: string): boolean {
  return orderId.startsWith('DEMO-')
}

export function getDemoStyling() {
  return {
    banner: {
      background: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      text: 'text-white',
      border: 'border-blue-200'
    },
    badge: {
      background: 'bg-blue-600',
      text: 'text-white',
      border: 'border-blue-200'
    },
    indicator: {
      background: 'bg-blue-50',
      text: 'text-blue-900',
      border: 'border-blue-200',
      accent: 'text-blue-600'
    }
  }
}