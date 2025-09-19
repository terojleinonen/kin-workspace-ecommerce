import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import DemoGuide from '../app/components/demo/DemoGuide'
import DemoDataManager from '../app/components/demo/DemoDataManager'
import { CMSSyncDashboard } from '../app/components/cms/CMSSyncDashboard'
import DemoModeIndicator from '../app/components/checkout/DemoModeIndicator'

// Mock Next.js router
const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/demo-guide',
}))

// Mock the demo mode context
const mockDemoModeContext = {
  isDemoMode: true,
  isResetting: false,
  resetDemoData: jest.fn().mockResolvedValue(undefined),
  generateDemoData: jest.fn().mockResolvedValue(undefined),
}

jest.mock('../app/contexts/DemoModeContext', () => ({
  useDemoMode: () => mockDemoModeContext,
}))

// Mock fetch for API calls
global.fetch = jest.fn()

describe('Demo Components Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('DemoModeIndicator Component', () => {
    test('should display demo mode indicator with correct information', () => {
      render(<DemoModeIndicator />)
      
      expect(screen.getByText('Demo Mode Active')).toBeInTheDocument()
      expect(screen.getByText(/This is a demonstration checkout/)).toBeInTheDocument()
      expect(screen.getByText('DEMO')).toBeInTheDocument()
      
      // Check for demo card numbers
      expect(screen.getByText(/4111 1111 1111 1111/)).toBeInTheDocument()
      expect(screen.getByText(/4000 0000 0000 0002/)).toBeInTheDocument()
      expect(screen.getByText(/4000 0000 0000 9995/)).toBeInTheDocument()
      expect(screen.getByText(/4000 0000 0000 9987/)).toBeInTheDocument()
    })

    test('should display demo card usage instructions', () => {
      render(<DemoModeIndicator />)
      
      expect(screen.getByText(/Use any future expiry date/)).toBeInTheDocument()
      expect(screen.getByText(/any 3-digit CVV/)).toBeInTheDocument()
    })
  })

  describe('DemoGuide Component', () => {
    test('should display demo scenarios and use cases', () => {
      render(<DemoGuide />)

      expect(screen.getByText('Demo Scenarios')).toBeInTheDocument()
      expect(screen.getByText('Complete Shopping Experience')).toBeInTheDocument()
      expect(screen.getByText('Payment Processing Demo')).toBeInTheDocument()
      expect(screen.getByText('Order Management')).toBeInTheDocument()
      expect(screen.getByText('Product Reviews System')).toBeInTheDocument()
      expect(screen.getByText('User Account Features')).toBeInTheDocument()
      expect(screen.getByText('Admin & CMS Features')).toBeInTheDocument()
    })

    test('should expand scenario details when clicked', async () => {
      const user = userEvent.setup()
      render(<DemoGuide />)

      // Click on the first scenario
      const shoppingScenario = screen.getByText('Complete Shopping Experience')
      await user.click(shoppingScenario)

      // Check if steps are shown
      expect(screen.getByText('Step-by-step instructions:')).toBeInTheDocument()
      expect(screen.getByText('Start This Scenario')).toBeInTheDocument()
    })

    test('should show demo tips and feature highlights', () => {
      render(<DemoGuide />)

      expect(screen.getByText('Quick Tips for Demo Exploration')).toBeInTheDocument()
      expect(screen.getByText('💳 Demo Payment Cards')).toBeInTheDocument()
      expect(screen.getByText('👤 Demo Accounts')).toBeInTheDocument()
      expect(screen.getByText('🔄 Reset Demo Data')).toBeInTheDocument()
      expect(screen.getByText('🎭 Demo Mode')).toBeInTheDocument()
      
      expect(screen.getByText('Key Features to Explore')).toBeInTheDocument()
      expect(screen.getByText('Smart Shopping Cart')).toBeInTheDocument()
      expect(screen.getByText('Payment Processing')).toBeInTheDocument()
      expect(screen.getByText('Order Tracking')).toBeInTheDocument()
    })
  })

  describe('DemoDataManager Component', () => {
    test('should display demo data management interface', () => {
      render(<DemoDataManager />)

      expect(screen.getByText('Demo Data Management')).toBeInTheDocument()
      expect(screen.getByText('Manage demo data for testing and demonstration purposes')).toBeInTheDocument()
      expect(screen.getByText('🎭 DEMO MODE')).toBeInTheDocument()
    })

    test('should show demo data statistics', () => {
      render(<DemoDataManager />)

      expect(screen.getByText('Demo Users')).toBeInTheDocument()
      expect(screen.getByText('Demo Orders')).toBeInTheDocument()
      expect(screen.getByText('Demo Reviews')).toBeInTheDocument()
    })

    test('should handle demo data generation', async () => {
      const user = userEvent.setup()
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            users: 5,
            orders: 10,
            reviews: 15
          }
        })
      })

      // Mock window.alert
      window.alert = jest.fn()

      render(<DemoDataManager />)

      const generateButton = screen.getByText('Generate Demo Data')
      await user.click(generateButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/demo/generate', expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userCount: 5,
            orderCount: 10,
            reviewCount: 15
          })
        }))
      })
    })

    test('should handle demo data reset', async () => {
      const user = userEvent.setup()
      
      // Mock window.confirm to return true
      window.confirm = jest.fn().mockReturnValue(true)

      render(<DemoDataManager />)

      const resetButton = screen.getByText('Reset All Data')
      await user.click(resetButton)

      expect(mockDemoModeContext.resetDemoData).toHaveBeenCalled()
    })

    test('should show demo scenarios', () => {
      render(<DemoDataManager />)

      expect(screen.getByText('Demo Scenarios')).toBeInTheDocument()
      expect(screen.getByText('Customer Journey')).toBeInTheDocument()
      expect(screen.getByText('Order Management')).toBeInTheDocument()
      expect(screen.getByText('Review System')).toBeInTheDocument()
      expect(screen.getByText('Payment Processing')).toBeInTheDocument()
    })
  })

  describe('CMSSyncDashboard Component', () => {
    const mockStatus = {
      isHealthy: true,
      lastSuccessfulSync: new Date(),
      lastAttemptedSync: new Date(),
      errorCount: 0,
      lastError: null,
      daysSinceLastSync: 0,
      circuitBreakerOpen: false
    }

    const mockHistory = [
      {
        success: true,
        productsUpdated: 5,
        productsAdded: 2,
        productsRemoved: 0,
        errors: [],
        lastSync: new Date(),
        duration: 2500
      }
    ]

    test('should display CMS sync dashboard', () => {
      render(
        <CMSSyncDashboard 
          initialStatus={mockStatus}
          initialHistory={mockHistory}
        />
      )

      expect(screen.getByText('CMS Sync Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Manual Sync')).toBeInTheDocument()
    })

    test('should handle manual sync trigger', async () => {
      const user = userEvent.setup()
      const mockTriggerSync = jest.fn().mockResolvedValue({
        success: true,
        productsUpdated: 3,
        productsAdded: 1,
        productsRemoved: 0,
        errors: [],
        lastSync: new Date(),
        duration: 1500
      })

      render(
        <CMSSyncDashboard 
          initialStatus={mockStatus}
          initialHistory={mockHistory}
          onTriggerSync={mockTriggerSync}
        />
      )

      const syncButton = screen.getByText('Start Sync')
      await user.click(syncButton)

      expect(mockTriggerSync).toHaveBeenCalled()
    })

    test('should show sync options', () => {
      render(
        <CMSSyncDashboard 
          initialStatus={mockStatus}
          initialHistory={mockHistory}
        />
      )

      expect(screen.getByText('Category Filter (optional)')).toBeInTheDocument()
      expect(screen.getByText('Force update all products (ignore timestamps)')).toBeInTheDocument()
    })

    test('should handle category filter selection', async () => {
      const user = userEvent.setup()
      
      render(
        <CMSSyncDashboard 
          initialStatus={mockStatus}
          initialHistory={mockHistory}
        />
      )

      const categorySelect = screen.getByLabelText('Category Filter (optional)')
      await user.selectOptions(categorySelect, 'Desks')

      expect(categorySelect).toHaveValue('Desks')
    })

    test('should handle force update checkbox', async () => {
      const user = userEvent.setup()
      
      render(
        <CMSSyncDashboard 
          initialStatus={mockStatus}
          initialHistory={mockHistory}
        />
      )

      const forceUpdateCheckbox = screen.getByLabelText('Force update all products (ignore timestamps)')
      await user.click(forceUpdateCheckbox)

      expect(forceUpdateCheckbox).toBeChecked()
    })
  })

  describe('Integration Flow Tests', () => {
    test('should demonstrate complete demo workflow', async () => {
      const user = userEvent.setup()

      // Test DemoGuide interaction
      const { rerender } = render(<DemoGuide />)
      
      // Expand a scenario
      const shoppingScenario = screen.getByText('Complete Shopping Experience')
      await user.click(shoppingScenario)
      
      expect(screen.getByText('Start This Scenario')).toBeInTheDocument()

      // Test DemoDataManager
      rerender(<DemoDataManager />)
      
      expect(screen.getByText('Demo Data Management')).toBeInTheDocument()
      expect(screen.getByText('Generate Demo Data')).toBeInTheDocument()
      expect(screen.getByText('Reset All Data')).toBeInTheDocument()

      // Test DemoModeIndicator
      rerender(<DemoModeIndicator />)
      
      expect(screen.getByText('Demo Mode Active')).toBeInTheDocument()
      expect(screen.getByText('DEMO')).toBeInTheDocument()
    })

    test('should handle error scenarios gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock fetch to fail
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
      
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Mock window.alert
      window.alert = jest.fn()

      render(<DemoDataManager />)

      const generateButton = screen.getByText('Generate Demo Data')
      await user.click(generateButton)

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to generate demo data. Please try again.')
      })

      consoleSpy.mockRestore()
    })
  })
})