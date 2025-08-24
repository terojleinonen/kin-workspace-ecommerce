'use client'

export default function DemoModeIndicator() {
  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">🎭</span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-satoshi font-bold text-blue-900 text-lg">
            Demo Mode Active
          </h3>
          <p className="text-blue-800 text-sm mt-1">
            This is a demonstration checkout. No real payments will be processed and no actual orders will be placed.
          </p>
        </div>
        <div className="flex-shrink-0">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
            DEMO
          </span>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-white/60 rounded-lg">
        <h4 className="font-satoshi font-semibold text-blue-900 text-sm mb-2">
          Demo Credit Cards for Testing:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-blue-800">
          <div>
            <strong>Success:</strong> 4111 1111 1111 1111
          </div>
          <div>
            <strong>Decline:</strong> 4000 0000 0000 0002
          </div>
          <div>
            <strong>Insufficient Funds:</strong> 4000 0000 0000 9995
          </div>
          <div>
            <strong>Lost Card:</strong> 4000 0000 0000 9987
          </div>
        </div>
        <p className="text-blue-700 text-xs mt-2">
          Use any future expiry date (e.g., 12/25) and any 3-digit CVV (e.g., 123).
        </p>
      </div>
    </div>
  )
}