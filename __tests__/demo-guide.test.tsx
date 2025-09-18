import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import DemoGuide from '../app/components/demo/DemoGuide'
import DemoHelp from '../app/components/demo/DemoHelp'
import DemoTour, { useDemoTour } from '../app/components/demo/DemoTour'
import { renderHook, act } from '@testing-library/react'

// Mock environment variables
const originalEnv = process.env

beforeEach(() => {
  jest.resetModules()
  process.env = { ...originalEnv }
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  })
})

afterEach(() => {
  process.env = originalEnv
})

describe('Demo Guide Components', () => {
  describe('DemoGuide', () => {
    test('should render demo scenarios', () => {
      render(<DemoGuide />)
      
      expect(screen.getByText('Demo Scenarios')).toBeInTheDocument()
      expect(screen.getByText('Complete Shopping Experience')).toBeInTheDocument()
      expect(screen.getByText('Payment Processing Demo')).toBeInTheDocument()
      expect(screen.getByText('Order Management')).toBeInTheDocument()
      expect(screen.getByText('Product Reviews System')).toBeInTheDocument()
      expect(screen.getByText('User Account Features')).toBeInTheDocument()
      expect(screen.getByText('Admin & CMS Features')).toBeInTheDocument()
    })

    test('should expand scenario details when clicked', () => {
      render(<DemoGuide />)
      
      const shoppingScenario = screen.getByText('Complete Shopping Experience')
      fireEvent.click(shoppingScenario)
      
      expect(screen.getByText('Step-by-step instructions:')).toBeInTheDocument()
      expect(screen.getByText('Start This Scenario')).toBeInTheDocument()
    })

    test('should show quick tips section', () => {
      render(<DemoGuide />)
      
      expect(screen.getByText('Quick Tips for Demo Exploration')).toBeInTheDocument()
      expect(screen.getByText('💳 Demo Payment Cards')).toBeInTheDocument()
      expect(screen.getByText('👤 Demo Accounts')).toBeInTheDocument()
      expect(screen.getByText('🔄 Reset Demo Data')).toBeInTheDocument()
      expect(screen.getByText('🎭 Demo Mode')).toBeInTheDocument()
    })

    test('should show feature highlights', () => {
      render(<DemoGuide />)
      
      expect(screen.getByText('Key Features to Explore')).toBeInTheDocument()
      expect(screen.getByText('Smart Shopping Cart')).toBeInTheDocument()
      expect(screen.getByText('Payment Processing')).toBeInTheDocument()
      expect(screen.getByText('Order Tracking')).toBeInTheDocument()
    })
  })

  describe('DemoHelp', () => {
    test('should render help button when in demo mode', () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true'
      
      render(<DemoHelp />)
      
      expect(screen.getByText('Demo Help')).toBeInTheDocument()
    })

    test('should not render when not in demo mode', () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'false'
      
      render(<DemoHelp />)
      
      expect(screen.queryByText('Demo Help')).not.toBeInTheDocument()
    })

    test('should open help modal when clicked', () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true'
      
      render(<DemoHelp />)
      
      const helpButton = screen.getByText('Demo Help')
      fireEvent.click(helpButton)
      
      expect(screen.getByText('Demo Mode Help')).toBeInTheDocument()
      expect(screen.getByText('What you can do:')).toBeInTheDocument()
      expect(screen.getByText('Quick Reference:')).toBeInTheDocument()
    })

    test('should show contextual help for checkout', () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true'
      
      render(<DemoHelp context="checkout" />)
      
      const helpButton = screen.getByText('Demo Help')
      fireEvent.click(helpButton)
      
      expect(screen.getByText('Demo Checkout Help')).toBeInTheDocument()
      expect(screen.getByText(/Use demo credit card numbers/)).toBeInTheDocument()
    })

    test('should show contextual help for orders', () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true'
      
      render(<DemoHelp context="orders" />)
      
      const helpButton = screen.getByText('Demo Help')
      fireEvent.click(helpButton)
      
      expect(screen.getByText('Demo Orders Help')).toBeInTheDocument()
      expect(screen.getByText(/View sample orders/)).toBeInTheDocument()
    })

    test('should close modal when close button is clicked', () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true'
      
      render(<DemoHelp />)
      
      const helpButton = screen.getByText('Demo Help')
      fireEvent.click(helpButton)
      
      // Find the close button by its SVG icon (X mark)
      const closeButtons = screen.getAllByRole('button')
      const closeButton = closeButtons.find(button => 
        button.querySelector('svg') && 
        button.className.includes('text-slate-gray')
      )
      
      expect(closeButton).toBeTruthy()
      fireEvent.click(closeButton!)
      
      expect(screen.queryByText('Demo Mode Help')).not.toBeInTheDocument()
    })
  })

  describe('DemoTour', () => {
    const mockSteps = [
      {
        id: 'step1',
        title: 'Welcome',
        content: 'Welcome to the demo tour',
        target: '.demo-target'
      },
      {
        id: 'step2',
        title: 'Next Step',
        content: 'This is the second step',
        target: '.demo-target-2'
      }
    ]

    test('should render tour when open', () => {
      render(
        <DemoTour 
          steps={mockSteps} 
          isOpen={true} 
          onClose={() => {}} 
        />
      )
      
      expect(screen.getByText('Welcome')).toBeInTheDocument()
      expect(screen.getByText('Welcome to the demo tour')).toBeInTheDocument()
      expect(screen.getByText('1 of 2')).toBeInTheDocument()
    })

    test('should not render when closed', () => {
      render(
        <DemoTour 
          steps={mockSteps} 
          isOpen={false} 
          onClose={() => {}} 
        />
      )
      
      expect(screen.queryByText('Welcome')).not.toBeInTheDocument()
    })

    test('should navigate between steps', () => {
      render(
        <DemoTour 
          steps={mockSteps} 
          isOpen={true} 
          onClose={() => {}} 
        />
      )
      
      expect(screen.getByText('Welcome')).toBeInTheDocument()
      
      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)
      
      expect(screen.getByText('Next Step')).toBeInTheDocument()
      expect(screen.getByText('2 of 2')).toBeInTheDocument()
    })

    test('should call onComplete when tour is finished', () => {
      const mockOnComplete = jest.fn()
      
      render(
        <DemoTour 
          steps={mockSteps} 
          isOpen={true} 
          onClose={() => {}} 
          onComplete={mockOnComplete}
        />
      )
      
      // Navigate to last step
      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)
      
      // Finish tour
      const finishButton = screen.getByText('Finish')
      fireEvent.click(finishButton)
      
      expect(mockOnComplete).toHaveBeenCalled()
    })
  })

  describe('useDemoTour hook', () => {
    test('should manage tour state correctly', () => {
      const { result } = renderHook(() => useDemoTour())
      
      expect(result.current.isOpen).toBe(false)
      expect(result.current.hasSeenTour).toBe(false)
      
      act(() => {
        result.current.startTour()
      })
      
      expect(result.current.isOpen).toBe(true)
      
      act(() => {
        result.current.closeTour()
      })
      
      expect(result.current.isOpen).toBe(false)
    })

    test('should handle tour completion', () => {
      const mockSetItem = jest.fn()
      Object.defineProperty(window, 'localStorage', {
        value: { ...window.localStorage, setItem: mockSetItem },
        writable: true,
      })
      
      const { result } = renderHook(() => useDemoTour())
      
      act(() => {
        result.current.completeTour()
      })
      
      expect(mockSetItem).toHaveBeenCalledWith('demo-tour-completed', 'true')
      expect(result.current.isOpen).toBe(false)
    })

    test('should reset tour state', () => {
      const mockRemoveItem = jest.fn()
      Object.defineProperty(window, 'localStorage', {
        value: { ...window.localStorage, removeItem: mockRemoveItem },
        writable: true,
      })
      
      const { result } = renderHook(() => useDemoTour())
      
      act(() => {
        result.current.resetTour()
      })
      
      expect(mockRemoveItem).toHaveBeenCalledWith('demo-tour-completed')
      expect(result.current.hasSeenTour).toBe(false)
    })
  })
})