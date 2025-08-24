'use client'

interface DemoReceiptProps {
  receipt: {
    paymentId: string
    amount: number
    currency: string
    timestamp: Date | string
    last4?: string
    brand?: string
    isDemoTransaction: boolean
  }
  order: {
    id: string
    status: string
    total: number
    createdAt: Date | string
  }
}

export default function DemoReceipt({ receipt, order }: DemoReceiptProps) {
  const timestamp = typeof receipt.timestamp === 'string' 
    ? new Date(receipt.timestamp) 
    : receipt.timestamp

  const orderDate = typeof order.createdAt === 'string'
    ? new Date(order.createdAt)
    : order.createdAt

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
      {/* Demo Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🎭</span>
          </div>
          <div>
            <h3 className="font-satoshi font-bold text-blue-900 text-lg">
              Demo Transaction Receipt
            </h3>
            <p className="text-blue-700 text-sm">
              This is a simulated transaction - no real payment was processed
            </p>
          </div>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white">
          DEMO MODE
        </span>
      </div>

      {/* Receipt Details */}
      <div className="bg-white/70 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-satoshi font-semibold text-blue-900 text-sm mb-1">
              Transaction ID
            </h4>
            <p className="text-blue-800 text-sm font-mono">
              {receipt.paymentId}
            </p>
          </div>
          <div>
            <h4 className="font-satoshi font-semibold text-blue-900 text-sm mb-1">
              Order ID
            </h4>
            <p className="text-blue-800 text-sm font-mono">
              {order.id}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-satoshi font-semibold text-blue-900 text-sm mb-1">
              Amount
            </h4>
            <p className="text-blue-800 text-lg font-bold">
              ${receipt.amount.toFixed(2)} {receipt.currency}
            </p>
          </div>
          <div>
            <h4 className="font-satoshi font-semibold text-blue-900 text-sm mb-1">
              Payment Method
            </h4>
            <p className="text-blue-800 text-sm">
              {receipt.brand} ending in {receipt.last4}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-satoshi font-semibold text-blue-900 text-sm mb-1">
              Transaction Date
            </h4>
            <p className="text-blue-800 text-sm">
              {timestamp.toLocaleDateString()} at {timestamp.toLocaleTimeString()}
            </p>
          </div>
          <div>
            <h4 className="font-satoshi font-semibold text-blue-900 text-sm mb-1">
              Status
            </h4>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✓ Demo Success
            </span>
          </div>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <span className="text-yellow-600 text-sm">⚠️</span>
          <div>
            <p className="text-yellow-800 text-sm font-medium">
              Demo Transaction Notice
            </p>
            <p className="text-yellow-700 text-xs mt-1">
              This receipt is for demonstration purposes only. No actual payment was processed, 
              no money was charged, and no real order was placed. This is a simulation of what 
              a real transaction receipt would look like.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}