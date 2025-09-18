import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import DemoModeBanner from '../app/components/DemoModeBanner'
import DemoBadge from '../app/components/DemoBadge'
import { DemoModeProvider } from '../app/contexts/DemoModeContext'

// Mock environment variables
const originalEnv = process.env

beforeEach(() => {
  jest.resetModules()
  process.env = { ...originalEnv }
  // Clear localStorage
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

describe('Demo Mode Indicators', () => {
  describe('DemoModeBanner', () => {
    test('should render banner when in demo mode', () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true'
      
      render(<DemoModeBanner />)
      
      expect(screen.getByText('DEMO MODE')).toBeInTheDocument()
      expect(screen.getByText(/You're viewing a demonstration/)).toBeInTheDocument()
      expect(screen.getByText('Learn More')).toBeInTheDocument()
    })

    test('should not render banner when not in demo mode', () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'false'
      
      render(<DemoModeBanner />)
      
      expect(screen.queryByText('DEMO MODE')).not.toBeInTheDocument()
    })

    test('should dismiss banner when close button is clicked', () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true'
      const mockSetItem = jest.fn()
      Object.defineProperty(window, 'localStorage', {
        value: { ...window.localStorage, setItem: mockSetItem },
        writable: true,
      })
      
      render(<DemoModeBanner />)
      
      const closeButton = screen.getByLabelText('Dismiss demo banner')
      fireEvent.click(closeButton)
      
      expect(mockSetItem).toHaveBeenCalledWith('demo-banner-dismissed', 'true')
    })

    test('should not render if previously dismissed', () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true'
      const mockGetItem = jest.fn().mockReturnValue('true')
      Object.defineProperty(window, 'localStorage', {
        value: { ...window.localStorage, getItem: mockGetItem },
        writable: true,
      })
      
      render(<DemoModeBanner />)
      
      expect(screen.queryByText('DEMO MODE')).not.toBeInTheDocument()
    })
  })

  describe('DemoBadge', () => {
    test('should render badge when in demo mode', () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true'
      
      render(<DemoBadge />)
      
      expect(screen.getByText('DEMO')).toBeInTheDocument()
    })

    test('should not render badge when not in demo mode', () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'false'
      
      render(<DemoBadge />)
      
      expect(screen.queryByText('DEMO')).not.toBeInTheDocument()
    })

    test('should render different variants correctly', () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true'
      
      const { rerender } = render(<DemoBadge variant="small" />)
      expect(screen.getByText('DEMO')).toHaveClass('px-2', 'py-0.5', 'text-xs')
      
      rerender(<DemoBadge variant="large" />)
      expect(screen.getByText('DEMO')).toHaveClass('px-4', 'py-2', 'text-sm')
    })

    test('should render with or without icon', () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true'
      
      const { rerender } = render(<DemoBadge showIcon={true} />)
      expect(screen.getByText('🎭')).toBeInTheDocument()
      
      rerender(<DemoBadge showIcon={false} />)
      expect(screen.queryByText('🎭')).not.toBeInTheDocument()
    })
  })

  describe('DemoModeProvider', () => {
    test('should provide demo mode context', () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true'
      
      const TestComponent = () => {
        return (
          <DemoModeProvider>
            <div>Demo Provider Test</div>
          </DemoModeProvider>
        )
      }
      
      render(<TestComponent />)
      expect(screen.getByText('Demo Provider Test')).toBeInTheDocument()
    })
  })
})