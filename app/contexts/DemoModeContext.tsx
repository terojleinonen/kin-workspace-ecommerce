'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface DemoModeContextType {
  isDemoMode: boolean
  showDemoIndicators: boolean
  toggleDemoIndicators: () => void
  resetDemoData: () => Promise<void>
  isResetting: boolean
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined)

export function useDemoMode() {
  const context = useContext(DemoModeContext)
  if (context === undefined) {
    throw new Error('useDemoMode must be used within a DemoModeProvider')
  }
  return context
}

interface DemoModeProviderProps {
  children: ReactNode
}

export function DemoModeProvider({ children }: DemoModeProviderProps) {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [showDemoIndicators, setShowDemoIndicators] = useState(true)
  const [isResetting, setIsResetting] = useState(false)

  useEffect(() => {
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
    setIsDemoMode(demoMode)
    
    // Check if user has hidden demo indicators
    const hiddenIndicators = localStorage.getItem('demo-indicators-hidden')
    setShowDemoIndicators(demoMode && !hiddenIndicators)
  }, [])

  const toggleDemoIndicators = () => {
    const newValue = !showDemoIndicators
    setShowDemoIndicators(newValue)
    
    if (newValue) {
      localStorage.removeItem('demo-indicators-hidden')
    } else {
      localStorage.setItem('demo-indicators-hidden', 'true')
    }
  }

  const resetDemoData = async () => {
    if (!isDemoMode) return
    
    setIsResetting(true)
    try {
      // Call the demo reset API endpoint
      const response = await fetch('/api/demo/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to reset demo data')
      }
      
      // Clear local storage demo-related items
      localStorage.removeItem('demo-banner-dismissed')
      localStorage.removeItem('demo-indicators-hidden')
      
      // Refresh the page to show reset data
      window.location.reload()
    } catch (error) {
      console.error('Error resetting demo data:', error)
      alert('Failed to reset demo data. Please try again.')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <DemoModeContext.Provider
      value={{
        isDemoMode,
        showDemoIndicators,
        toggleDemoIndicators,
        resetDemoData,
        isResetting,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  )
}