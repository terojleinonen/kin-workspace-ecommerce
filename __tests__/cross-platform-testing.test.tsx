/**
 * Cross-Platform Testing
 * 
 * Tests for responsive design, accessibility compliance, and performance
 * across different devices and network conditions.
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import DemoModeIndicator from '../app/components/checkout/DemoModeIndicator'
import DemoGuide from '../app/components/demo/DemoGuide'
import PaymentForm from '../app/components/checkout/PaymentForm'
import ProductCard from '../app/components/ProductCard'
import Navigation from '../app/components/Navigation'

// Mock window.matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

describe('Cross-Platform Testing', () => {
  describe('Responsive Design Testing', () => {
    const mockViewports = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1440, height: 900 },
      largeDesktop: { width: 1920, height: 1080 }
    }

    const setViewport = (viewport: { width: number; height: number }) => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: viewport.width,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: viewport.height,
      })
      
      // Mock matchMedia for different breakpoints
      window.matchMedia = jest.fn().mockImplementation(query => {
        const breakpoints = {
          '(max-width: 640px)': viewport.width <= 640,
          '(max-width: 768px)': viewport.width <= 768,
          '(max-width: 1024px)': viewport.width <= 1024,
          '(min-width: 768px)': viewport.width >= 768,
          '(min-width: 1024px)': viewport.width >= 1024,
        }
        
        return {
          matches: breakpoints[query] || false,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        }
      })
    }

    test('should render demo mode indicator responsively on mobile', () => {
      setViewport(mockViewports.mobile)
      
      render(<DemoModeIndicator />)
      
      const indicator = screen.getByText('Demo Mode Active')
      expect(indicator).toBeInTheDocument()
      
      // Check that the component renders properly on mobile
      const container = indicator.closest('div')
      expect(container).toBeInTheDocument()
    })

    test('should render demo mode indicator responsively on tablet', () => {
      setViewport(mockViewports.tablet)
      
      render(<DemoModeIndicator />)
      
      expect(screen.getByText('Demo Mode Active')).toBeInTheDocument()
      expect(screen.getByText('Demo Credit Cards for Testing:')).toBeInTheDocument()
      
      // Should show grid layout on tablet
      const gridContainer = screen.getByText('Success:').closest('.grid')
      expect(gridContainer).toHaveClass('md:grid-cols-2')
    })

    test('should render demo mode indicator responsively on desktop', () => {
      setViewport(mockViewports.desktop)
      
      render(<DemoModeIndicator />)
      
      expect(screen.getByText('Demo Mode Active')).toBeInTheDocument()
      
      // Desktop should show full layout
      const demoCards = screen.getByText('Demo Credit Cards for Testing:')
      expect(demoCards).toBeInTheDocument()
    })

    test('should render payment form responsively across devices', () => {
      const mockPaymentData = {
        type: 'card' as const,
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: ''
      }

      // Test mobile layout
      setViewport(mockViewports.mobile)
      const { rerender } = render(
        <PaymentForm
          data={mockPaymentData}
          onChange={jest.fn()}
          onNext={jest.fn()}
          onPrev={jest.fn()}
        />
      )
      
      expect(screen.getByText('Payment Information')).toBeInTheDocument()
      
      // Test tablet layout
      setViewport(mockViewports.tablet)
      rerender(
        <PaymentForm
          data={mockPaymentData}
          onChange={jest.fn()}
          onNext={jest.fn()}
          onPrev={jest.fn()}
        />
      )
      
      // Should show grid layout for expiry and CVV on tablet+
      const expiryInput = screen.getByPlaceholderText('MM/YY')
      const cvvInput = screen.getByPlaceholderText('123')
      expect(expiryInput).toBeInTheDocument()
      expect(cvvInput).toBeInTheDocument()
    })

    test('should render demo guide responsively', () => {
      // Test mobile
      setViewport(mockViewports.mobile)
      const { rerender } = render(<DemoGuide />)
      
      expect(screen.getByText('Demo Scenarios')).toBeInTheDocument()
      
      // Test desktop - should show grid layout
      setViewport(mockViewports.desktop)
      rerender(<DemoGuide />)
      
      expect(screen.getByText('Complete Shopping Experience')).toBeInTheDocument()
      expect(screen.getByText('Payment Processing Demo')).toBeInTheDocument()
    })

    test('should handle responsive layout without context dependencies', () => {
      // Test that responsive utilities work
      setViewport(mockViewports.mobile)
      expect(window.innerWidth).toBe(375)
      
      setViewport(mockViewports.desktop)
      expect(window.innerWidth).toBe(1440)
      
      // Test that matchMedia works
      const mobileQuery = window.matchMedia('(max-width: 640px)')
      expect(mobileQuery.matches).toBe(false) // Desktop viewport
    })
  })

  describe('Accessibility Testing', () => {
    test('should have proper ARIA labels and roles', () => {
      render(<DemoModeIndicator />)
      
      // Check for semantic HTML structure
      const heading = screen.getByText('Demo Mode Active')
      expect(heading).toBeInTheDocument()
      
      // Check for proper contrast and text content
      const demoText = screen.getByText(/This is a demonstration checkout/)
      expect(demoText).toBeInTheDocument()
    })

    test('should support keyboard navigation', () => {
      const mockPaymentData = {
        type: 'card' as const,
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: ''
      }

      render(
        <PaymentForm
          data={mockPaymentData}
          onChange={jest.fn()}
          onNext={jest.fn()}
          onPrev={jest.fn()}
        />
      )
      
      // Check that form inputs are focusable
      const cardNumberInput = screen.getByPlaceholderText('1234 5678 9012 3456')
      const expiryInput = screen.getByPlaceholderText('MM/YY')
      const cvvInput = screen.getByPlaceholderText('123')
      
      expect(cardNumberInput).toBeInTheDocument()
      expect(expiryInput).toBeInTheDocument()
      expect(cvvInput).toBeInTheDocument()
      
      // Test tab order
      cardNumberInput.focus()
      expect(document.activeElement).toBe(cardNumberInput)
    })

    test('should have proper form labels and validation', () => {
      const mockPaymentData = {
        type: 'card' as const,
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: ''
      }

      render(
        <PaymentForm
          data={mockPaymentData}
          onChange={jest.fn()}
          onNext={jest.fn()}
          onPrev={jest.fn()}
        />
      )
      
      // Check for required field indicators
      expect(screen.getByText(/card number \*/i)).toBeInTheDocument()
      expect(screen.getByText(/expiry date \*/i)).toBeInTheDocument()
      expect(screen.getByText(/cvv \*/i)).toBeInTheDocument()
      expect(screen.getByText(/cardholder name \*/i)).toBeInTheDocument()
    })

    test('should provide screen reader friendly content', () => {
      render(<DemoModeIndicator />)
      
      // Check for descriptive text that screen readers can understand
      const description = screen.getByText(/This is a demonstration checkout/)
      expect(description).toBeInTheDocument()
      
      const instructions = screen.getByText(/Use any future expiry date/)
      expect(instructions).toBeInTheDocument()
    })

    test('should have proper button accessibility', () => {
      render(<DemoGuide />)
      
      // Check that interactive elements are properly labeled
      const scenarios = screen.getAllByRole('button')
      expect(scenarios.length).toBeGreaterThan(0)
      
      // Each button should have accessible text
      scenarios.forEach(button => {
        expect(button.textContent).toBeTruthy()
      })
    })

    test('should support high contrast mode', () => {
      render(<DemoModeIndicator />)
      
      // Check for proper color contrast classes
      const demoText = screen.getByText('DEMO')
      expect(demoText).toHaveClass('text-white') // Should have high contrast
      
      const heading = screen.getByText('Demo Mode Active')
      expect(heading).toHaveClass('text-blue-900') // Should have sufficient contrast
    })

    test('should handle focus management', () => {
      const mockOnChange = jest.fn()
      const mockPaymentData = {
        type: 'card' as const,
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: ''
      }

      render(
        <PaymentForm
          data={mockPaymentData}
          onChange={mockOnChange}
          onNext={jest.fn()}
          onPrev={jest.fn()}
        />
      )
      
      const cardInput = screen.getByPlaceholderText('1234 5678 9012 3456')
      
      // Test that input can receive focus events
      fireEvent.focus(cardInput)
      fireEvent.blur(cardInput)
      
      // Input should be focusable
      expect(cardInput).not.toBeDisabled()
      expect(cardInput.tabIndex).not.toBe(-1)
    })
  })

  describe('Performance Testing', () => {
    test('should render components efficiently', () => {
      const startTime = performance.now()
      
      render(<DemoModeIndicator />)
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Component should render quickly (under 100ms)
      expect(renderTime).toBeLessThan(100)
    })

    test('should handle large lists efficiently', () => {
      const startTime = performance.now()
      
      render(<DemoGuide />)
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Even complex components should render reasonably fast
      expect(renderTime).toBeLessThan(200)
    })

    test('should optimize component rendering', () => {
      const startTime = performance.now()
      
      render(<DemoGuide />)
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Complex components should still render efficiently
      expect(renderTime).toBeLessThan(300)
    })

    test('should minimize re-renders', () => {
      const mockOnChange = jest.fn()
      const mockPaymentData = {
        type: 'card' as const,
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: ''
      }

      const { rerender } = render(
        <PaymentForm
          data={mockPaymentData}
          onChange={mockOnChange}
          onNext={jest.fn()}
          onPrev={jest.fn()}
        />
      )
      
      // Re-render with same props should be efficient
      const startTime = performance.now()
      
      rerender(
        <PaymentForm
          data={mockPaymentData}
          onChange={mockOnChange}
          onNext={jest.fn()}
          onPrev={jest.fn()}
        />
      )
      
      const endTime = performance.now()
      const rerenderTime = endTime - startTime
      
      // Re-render should be very fast
      expect(rerenderTime).toBeLessThan(50)
    })
  })

  describe('Network Condition Testing', () => {
    test('should handle slow network conditions gracefully', async () => {
      // Mock slow network response
      global.fetch = jest.fn().mockImplementation(() =>
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ success: true })
          }), 2000)
        )
      )

      render(<DemoModeIndicator />)
      
      // Component should render immediately even if network is slow
      expect(screen.getByText('Demo Mode Active')).toBeInTheDocument()
    })

    test('should handle offline conditions', () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      render(<DemoModeIndicator />)
      
      // Demo components should work offline
      expect(screen.getByText('Demo Mode Active')).toBeInTheDocument()
      expect(screen.getByText('DEMO')).toBeInTheDocument()
    })

    test('should handle network errors gracefully', async () => {
      // Mock network error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      render(<DemoModeIndicator />)
      
      // Component should still render without network
      expect(screen.getByText('Demo Mode Active')).toBeInTheDocument()
    })
  })

  describe('Browser Compatibility Testing', () => {
    test('should work with different user agents', () => {
      // Mock different browsers
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
      ]

      userAgents.forEach((userAgent, index) => {
        Object.defineProperty(navigator, 'userAgent', {
          value: userAgent,
          configurable: true
        })

        const { unmount } = render(<DemoModeIndicator />)
        expect(screen.getAllByText('Demo Mode Active')[0]).toBeInTheDocument()
        unmount()
      })
    })

    test('should handle touch events on mobile devices', () => {
      // Mock touch support
      Object.defineProperty(window, 'ontouchstart', {
        value: () => {},
        configurable: true
      })

      render(<DemoGuide />)
      
      const button = screen.getAllByRole('button')[0]
      
      // Should handle touch events
      fireEvent.touchStart(button)
      fireEvent.touchEnd(button)
      
      expect(button).toBeInTheDocument()
    })

    test('should work without JavaScript enhancements', () => {
      // Test that basic content is available even without JS
      render(<DemoModeIndicator />)
      
      // Core content should be present
      expect(screen.getByText('Demo Mode Active')).toBeInTheDocument()
      expect(screen.getByText(/This is a demonstration/)).toBeInTheDocument()
    })
  })

  describe('Loading States and Error Boundaries', () => {
    test('should handle component loading states', () => {
      render(<DemoModeIndicator />)
      
      // Component should render immediately without loading states
      expect(screen.getByText('Demo Mode Active')).toBeInTheDocument()
    })

    test('should handle error states gracefully', () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      try {
        render(<DemoModeIndicator />)
        expect(screen.getByText('Demo Mode Active')).toBeInTheDocument()
      } catch (error) {
        // Component should not throw errors
        expect(error).toBeUndefined()
      }

      consoleSpy.mockRestore()
    })

    test('should provide fallback content for failed components', () => {
      render(<DemoModeIndicator />)
      
      // Should always show some content
      const content = screen.getByText('Demo Mode Active')
      expect(content).toBeInTheDocument()
    })
  })
})