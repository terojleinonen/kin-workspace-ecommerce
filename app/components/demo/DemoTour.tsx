'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface TourStep {
  id: string
  title: string
  content: string
  target?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  action?: () => void
}

interface DemoTourProps {
  steps: TourStep[]
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
}

export default function DemoTour({ steps, isOpen, onClose, onComplete }: DemoTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen && steps[currentStep]?.target) {
      const element = document.querySelector(steps[currentStep].target) as HTMLElement
      setTargetElement(element)
      
      if (element) {
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        
        // Add highlight class
        element.classList.add('demo-tour-highlight')
        
        return () => {
          element.classList.remove('demo-tour-highlight')
        }
      }
    }
  }, [currentStep, isOpen, steps])

  useEffect(() => {
    // Add tour styles to document
    if (isOpen) {
      const style = document.createElement('style')
      style.textContent = `
        .demo-tour-highlight {
          position: relative;
          z-index: 1001;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.2) !important;
          border-radius: 8px;
          transition: box-shadow 0.3s ease;
        }
        .demo-tour-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          z-index: 1000;
          pointer-events: none;
        }
      `
      document.head.appendChild(style)
      
      return () => {
        document.head.removeChild(style)
      }
    }
  }, [isOpen])

  if (!isOpen || steps.length === 0) {
    return null
  }

  const currentStepData = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  const handleNext = () => {
    if (currentStepData.action) {
      currentStepData.action()
    }
    
    if (isLastStep) {
      onComplete?.()
      onClose()
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  // Calculate tooltip position
  const getTooltipPosition = () => {
    if (!targetElement) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    }

    const rect = targetElement.getBoundingClientRect()
    const position = currentStepData.position || 'bottom'
    
    switch (position) {
      case 'top':
        return {
          top: rect.top - 10,
          left: rect.left + rect.width / 2,
          transform: 'translate(-50%, -100%)'
        }
      case 'bottom':
        return {
          top: rect.bottom + 10,
          left: rect.left + rect.width / 2,
          transform: 'translate(-50%, 0)'
        }
      case 'left':
        return {
          top: rect.top + rect.height / 2,
          left: rect.left - 10,
          transform: 'translate(-100%, -50%)'
        }
      case 'right':
        return {
          top: rect.top + rect.height / 2,
          left: rect.right + 10,
          transform: 'translate(0, -50%)'
        }
      default:
        return {
          top: rect.bottom + 10,
          left: rect.left + rect.width / 2,
          transform: 'translate(-50%, 0)'
        }
    }
  }

  return (
    <>
      {/* Overlay */}
      <div className="demo-tour-overlay" />
      
      {/* Tooltip */}
      <div
        className="fixed z-[1002] bg-white rounded-lg shadow-xl border border-warm-beige p-6 max-w-sm"
        style={getTooltipPosition()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-600 text-white">
              🎭 DEMO TOUR
            </span>
            <span className="text-sm text-slate-gray">
              {currentStep + 1} of {steps.length}
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="text-slate-gray hover:text-matte-black"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <h3 className="font-satoshi font-bold text-lg text-matte-black mb-2">
            {currentStepData.title}
          </h3>
          <p className="text-slate-gray text-sm leading-relaxed">
            {currentStepData.content}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-warm-beige rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={isFirstStep}
            className="flex items-center space-x-1 text-slate-gray hover:text-matte-black disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSkip}
              className="text-slate-gray hover:text-matte-black text-sm"
            >
              Skip Tour
            </button>
            <button
              onClick={handleNext}
              className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <span>{isLastStep ? 'Finish' : 'Next'}</span>
              {!isLastStep && <ChevronRightIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// Hook for managing demo tour state
export function useDemoTour() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasSeenTour, setHasSeenTour] = useState(false)

  useEffect(() => {
    // Check if user has seen the tour before
    const seen = localStorage.getItem('demo-tour-completed')
    setHasSeenTour(!!seen)
  }, [])

  const startTour = () => {
    setIsOpen(true)
  }

  const closeTour = () => {
    setIsOpen(false)
  }

  const completeTour = () => {
    localStorage.setItem('demo-tour-completed', 'true')
    setHasSeenTour(true)
    setIsOpen(false)
  }

  const resetTour = () => {
    localStorage.removeItem('demo-tour-completed')
    setHasSeenTour(false)
  }

  return {
    isOpen,
    hasSeenTour,
    startTour,
    closeTour,
    completeTour,
    resetTour
  }
}