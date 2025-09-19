import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { CartProvider } from '../app/contexts/CartContext'
import { DemoModeProvider } from '../app/contexts/DemoModeContext'
import { AuthProvider } from '../app/contexts/AuthContext'
import DemoModeIndicator from '../app/components/checkout/DemoModeIndicator'
import DemoReceipt from '../app/components/checkout/DemoReceipt'
import PaymentForm from '../app/components/checkout/PaymentForm'
import DemoGuide from '../app/components/demo/DemoGuide'
import DemoDataManager from '../app/components/demo/DemoDataManager'
import { CMSSyncDashboard } from '../app/components/cms/CMSSyncDashboard'

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
  usePathname: () => '/checkout',
}))

// Mock API calls
global.fetch = jest.fn()

// Mock contexts
const mockAuthContext = {
  user: {
    id: 'test-user-1',
    email: 'demo@kinworkspace.com',
    firstName: 'Demo',
    lastName: 'User'
  },
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  updateProfile: jest.fn(),
  isLoading: false,
  isAuthenticated: true
}

const mockDemoContext = {
  isDemoMode: true,
  showDemoIndicators: true,
  toggleDemoIndicators: jest.fn(),
  resetDemoData: jest.fn(),
  isResetting: false
}

const mockCartContext = {
  cart: {
    items: [
      {
        id: 'item-1',
        product: {
          id: 'desk-1',
          name: 'Modern Standing Desk',
          price: 599.99,
          image: '/images/desk-1.jpg',
          category: 'Desks',
          slug: 'modern-standing-desk'
        },
        quantity: 1
      }
    ],
    total: 599.99,
    itemCount: 1
  },
  addToCart: jest.fn(),
  removeFromCart: jest.fn(),
  updateQuantity: jest.fn(),
  clearCart: jest.fn(),
  isOpen: false,
  openCart: jest.fn(),
  closeCart: jest.fn()
}

// Mock the contexts with providers
jest.mock('../app/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mockAuthContext,
}))

jest.mock('../app/contexts/DemoModeContext', () => ({
  DemoModeProvider: ({ children }: { children: React.ReactNode }) => children,
  useDemoMode: () => mockDemoContext,
}))

jest.mock('../app/contexts/CartContext', () => ({
  CartProvider: ({ children }: { children: React.ReactNode }) => children,
  useCart: () => mockCartContext,
}))

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

describe('Demo Frontend Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('Demo Mode Indicator Component', () => {
    test('should display demo mode indicators', () => {
      render(
        <TestWrapper>
          <DemoModeIndicator />
        </TestWrapper>
      )

      expect(screen.getByText('Demo Mode Active')).toBeInTheDocument()
      expect(screen.getByText(/This is a demonstration checkout/)).toBeInTheDocument()
      expect(screen.getByText('DEMO')).toBeInTheDocument()
    })

    test('should show demo credit card numbers', () => {
      render(
        <TestWrapper>
          <DemoModeIndicator />
        </TestWrapper>
      )

      expect(screen.getByText('Demo Credit Cards for Testing:')).toBeInTheDocument()
      expect(screen.getByText(/4111 1111 1111 1111/)).toBeInTheDocument()
      expect(screen.getByText(/4000 0000 0000 0002/)).toBeInTheDocument()
      expect(screen.getByText(/4000 0000 0000 9995/)).toBeInTheDocument()
      expect(screen.getByText(/4000 0000 0000 9987/)).toBeInTheDocument()
    })

    test('should show demo payment instructions', () => {
      render(
        <TestWrapper>
          <DemoModeIndicator />
        </TestWrapper>
      )

      expect(screen.getByText(/Use any future expiry date/)).toBeInTheDocument()
      expect(screen.getByText(/any 3-digit CVV/)).toBeInTheDocument()
    })
  })

  describe('Demo Receipt Component', () => {
    const mockReceipt = {
      paymentId: 'demo_123456789',
      amount: 150.00,
      currency: 'USD',
      timestamp: new Date('2024-01-15T10:30:00Z'),
      last4: '1111',
      brand: 'Visa',
      isDemoTransaction: true
    }

    const mockOrder = {
      id: 'order_987654321',
      status: 'CONFIRMED',
      total: 150.00,
      createdAt: new Date('2024-01-15T10:30:00Z')
    }

    test('should render demo receipt with transaction details', () => {
      render(
        <TestWrapper>
          <DemoReceipt receipt={mockReceipt} order={mockOrder} />
        </TestWrapper>
      )
      
      expect(screen.getByText('Demo Transaction Receipt')).toBeInTheDocument()
      expect(screen.getByText('DEMO MODE')).toBeInTheDocument()
      expect(screen.getByText(/no real payment was processed/)).toBeInTheDocument()
      
      // Check transaction details
      expect(screen.getByText('demo_123456789')).toBeInTheDocument()
      expect(screen.getByText('order_987654321')).toBeInTheDocument()
      expect(screen.getByText('$150.00 USD')).toBeInTheDocument()
      expect(screen.getByText('Visa ending in 1111')).toBeInTheDocument()
    })

    test('should display demo transaction warning', () => {
      render(
        <TestWrapper>
          <DemoReceipt receipt={mockReceipt} order={mockOrder} />
        </TestWrapper>
      )
      
      expect(screen.getByText('Demo Transaction Notice')).toBeInTheDocument()
      expect(screen.getByText(/This receipt is for demonstration purposes only/)).toBeInTheDocument()
      expect(screen.getByText(/No actual payment was processed/)).toBeInTheDocument()
    })

  })

  describe('Payment Form Component', () => {
    const mockPaymentData = {
      type: 'card' as const,
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    }

    const mockPaymentInfo = {
      isDemo: true,
      demoInfo: {
        scenarios: [
          {
            name: 'Successful Payment',
            cardNumber: '4111111111111111',
            description: 'Standard Visa card that will process successfully'
          },
          {
            name: 'Card Declined',
            cardNumber: '4000000000000002',
            description: 'This card will always be declined'
          }
        ]
      }
    }

    test('should show demo mode indicators when in demo mode', () => {
      render(
        <TestWrapper>
          <PaymentForm
            data={mockPaymentData}
            onChange={jest.fn()}
            onNext={jest.fn()}
            onPrev={jest.fn()}
            paymentInfo={mockPaymentInfo}
          />
        </TestWrapper>
      )
      
      expect(screen.getByText('Demo Mode - Quick Fill Options')).toBeInTheDocument()
      expect(screen.getByText('Demo Payment Processing')).toBeInTheDocument()
      expect(screen.getByText(/This is a demonstration/)).toBeInTheDocument()
    })

    test('should display demo scenarios for quick fill', () => {
      render(
        <TestWrapper>
          <PaymentForm
            data={mockPaymentData}
            onChange={jest.fn()}
            onNext={jest.fn()}
            onPrev={jest.fn()}
            paymentInfo={mockPaymentInfo}
          />
        </TestWrapper>
      )
      
      expect(screen.getByText('Successful Payment')).toBeInTheDocument()
      expect(screen.getByText('Card Declined')).toBeInTheDocument()
      expect(screen.getByText(/4111 1111 1111 1111/)).toBeInTheDocument()
      expect(screen.getByText(/4000 0000 0000 0002/)).toBeInTheDocument()
    })

    test('should auto-fill payment data when demo scenario is clicked', async () => {
      const user = userEvent.setup()
      const mockOnChange = jest.fn()
      
      render(
        <TestWrapper>
          <PaymentForm
            data={mockPaymentData}
            onChange={mockOnChange}
            onNext={jest.fn()}
            onPrev={jest.fn()}
            paymentInfo={mockPaymentInfo}
          />
        </TestWrapper>
      )
      
      // Click on the successful payment scenario
      const successButton = screen.getByText('Successful Payment')
      await user.click(successButton)
      
      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockPaymentData,
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'Demo User'
      })
    })

    test('should show regular security notice when not in demo mode', () => {
      render(
        <TestWrapper>
          <PaymentForm
            data={mockPaymentData}
            onChange={jest.fn()}
            onNext={jest.fn()}
            onPrev={jest.fn()}
            paymentInfo={{ isDemo: false }}
          />
        </TestWrapper>
      )
      
      expect(screen.getByText('Secure Payment')).toBeInTheDocument()
      expect(screen.getByText(/Your payment information is encrypted/)).toBeInTheDocument()
      expect(screen.queryByText('Demo Payment Processing')).not.toBeInTheDocument()
    })
  })

  describe('Demo Guide Component', () => {
    test('should display demo scenarios', () => {
      render(
        <TestWrapper>
          <DemoGuide />
        </TestWrapper>
      )

      expect(screen.getByText('Demo Scenarios')).toBeInTheDocument()
      expect(screen.getByText('Complete Shopping Experience')).toBeInTheDocument()
      expect(screen.getByText('Payment Processing Demo')).toBeInTheDocument()
      expect(screen.getByText('Order Management')).toBeInTheDocument()
    })

    test('should show scenario details when clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <DemoGuide />
        </TestWrapper>
      )

      // Click on shopping scenario
      const shoppingScenario = screen.getByText('Complete Shopping Experience')
      await user.click(shoppingScenario)

      expect(screen.getByText('Step-by-step instructions:')).toBeInTheDocument()
      expect(screen.getByText('Start This Scenario')).toBeInTheDocument()
    })

    test('should display demo tips and accounts', () => {
      render(
        <TestWrapper>
          <DemoGuide />
        </TestWrapper>
      )

      expect(screen.getByText('Quick Tips for Demo Exploration')).toBeInTheDocument()
      expect(screen.getByText('💳 Demo Payment Cards')).toBeInTheDocument()
      expect(screen.getByText('👤 Demo Accounts')).toBeInTheDocument()
      expect(screen.getByText('🔄 Reset Demo Data')).toBeInTheDocument()
      expect(screen.getByText('🎭 Demo Mode')).toBeInTheDocument()
    })

    test('should show key features section', () => {
      render(
        <TestWrapper>
          <DemoGuide />
        </TestWrapper>
      )

      expect(screen.getByText('Key Features to Explore')).toBeInTheDocument()
      expect(screen.getByText('Smart Shopping Cart')).toBeInTheDocument()
      expect(screen.getByText('Payment Processing')).toBeInTheDocument()
      expect(screen.getByText('Order Tracking')).toBeInTheDocument()
    })
  })

  describe('Demo Data Manager Component', () => {
    test('should display demo data management interface', () => {
      render(
        <TestWrapper>
          <DemoDataManager />
        </TestWrapper>
      )

      expect(screen.getByText('Demo Data Management')).toBeInTheDocument()
      expect(screen.getByText('🎭 DEMO MODE')).toBeInTheDocument()
      expect(screen.getByText('Generate Demo Data')).toBeInTheDocument()
      expect(screen.getByText('Refresh Stats')).toBeInTheDocument()
      expect(screen.getByText('Reset All Data')).toBeInTheDocument()
    })

    test('should show demo scenarios section', () => {
      render(
        <TestWrapper>
          <DemoDataManager />
        </TestWrapper>
      )

      expect(screen.getByText('Demo Scenarios')).toBeInTheDocument()
      expect(screen.getByText('Customer Journey')).toBeInTheDocument()
      expect(screen.getByText('Order Management')).toBeInTheDocument()
      expect(screen.getByText('Review System')).toBeInTheDocument()
      expect(screen.getByText('Payment Processing')).toBeInTheDocument()
    })

    test('should handle demo data generation', async () => {
      const user = userEvent.setup()
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          data: {
            users: 5,
            orders: 10,
            reviews: 15
          }
        })
      })

      // Mock window.alert
      window.alert = jest.fn()

      render(
        <TestWrapper>
          <DemoDataManager />
        </TestWrapper>
      )

      const generateButton = screen.getByText('Generate Demo Data')
      await user.click(generateButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/demo/generate', expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userCount: 5,
            orderCount: 10,
            reviewCount: 15
          })
        }))
      })
    })

    test('should handle demo data reset with confirmation', async () => {
      const user = userEvent.setup()
      
      // Mock window.confirm to return true
      window.confirm = jest.fn(() => true)

      render(
        <TestWrapper>
          <DemoDataManager />
        </TestWrapper>
      )

      const resetButton = screen.getByText('Reset All Data')
      await user.click(resetButton)

      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to reset all demo data? This will delete all demo orders, reviews, and users (except admin).'
      )
      expect(mockDemoContext.resetDemoData).toHaveBeenCalled()
    })
  })

  describe('CMS Sync Dashboard Component', () => {
    const mockStatus = {
      isHealthy: true,
      lastSuccessfulSync: new Date('2024-01-15T10:30:00Z'),
      lastAttemptedSync: new Date('2024-01-15T10:30:00Z'),
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
        productsRemoved: 1,
        errors: [],
        lastSync: new Date('2024-01-15T10:30:00Z'),
        duration: 2500
      }
    ]

    test('should display CMS sync dashboard', () => {
      render(
        <TestWrapper>
          <CMSSyncDashboard 
            initialStatus={mockStatus}
            initialHistory={mockHistory}
          />
        </TestWrapper>
      )

      expect(screen.getByText('CMS Sync Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Manual Sync')).toBeInTheDocument()
      expect(screen.getByText('Start Sync')).toBeInTheDocument()
    })

    test('should show sync options', () => {
      render(
        <TestWrapper>
          <CMSSyncDashboard 
            initialStatus={mockStatus}
            initialHistory={mockHistory}
          />
        </TestWrapper>
      )

      expect(screen.getByText('Category Filter (optional)')).toBeInTheDocument()
      expect(screen.getByText('All Categories')).toBeInTheDocument()
      expect(screen.getByText('Force update all products (ignore timestamps)')).toBeInTheDocument()
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
        <TestWrapper>
          <CMSSyncDashboard 
            initialStatus={mockStatus}
            initialHistory={mockHistory}
            onTriggerSync={mockTriggerSync}
          />
        </TestWrapper>
      )

      const syncButton = screen.getByText('Start Sync')
      await user.click(syncButton)

      expect(mockTriggerSync).toHaveBeenCalled()
    })

    test('should show sync progress during sync', async () => {
      const user = userEvent.setup()
      const mockTriggerSync = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          productsUpdated: 3,
          errors: [],
          lastSync: new Date(),
          duration: 1500
        }), 100))
      )

      render(
        <TestWrapper>
          <CMSSyncDashboard 
            initialStatus={mockStatus}
            initialHistory={mockHistory}
            onTriggerSync={mockTriggerSync}
          />
        </TestWrapper>
      )

      const syncButton = screen.getByText('Start Sync')
      await user.click(syncButton)

      expect(screen.getByText('Syncing...')).toBeInTheDocument()
      expect(screen.getByText('Synchronizing products...')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText('Start Sync')).toBeInTheDocument()
      })
    })
  })

})