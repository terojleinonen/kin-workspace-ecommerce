'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

export default function DemoModeBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    // Check if we're in demo mode
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
    setIsDemoMode(demoMode)
    
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem('demo-banner-dismissed')
    setIsVisible(demoMode && !dismissed)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('demo-banner-dismissed', 'true')
  }

  const handleReset = () => {
    localStorage.removeItem('demo-banner-dismissed')
    setIsVisible(true)
  }

  if (!isDemoMode || !isVisible) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-6 w-6 text-blue-100" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                <span className="font-bold bg-white/20 px-2 py-1 rounded text-xs mr-2">
                  DEMO MODE
                </span>
                You're viewing a demonstration of Kin Workspace. All transactions are simulated and no real payments will be processed.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.open('/demo-guide', '_blank')}
              className="text-blue-100 hover:text-white text-sm underline"
            >
              Learn More
            </button>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 rounded-md text-blue-100 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Dismiss demo banner"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}