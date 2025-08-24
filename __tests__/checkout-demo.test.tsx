import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import DemoModeIndicator from '../app/components/checkout/DemoModeIndicator'
import DemoReceipt from '../app/components/checkout/DemoReceipt'
import PaymentForm from '../app/components/checkout/PaymentForm'

// Mock the cart context
const mockCartContext = {
  cart: { items: [], total: 0 },
  addToCart: jest.fn(),
  removeFromCart: jest.fn(),
  updateQuantity: jest.fn(),
  clearCart: jest.fn(),
  isOpen: false,
  openCart: jest.fn(),
  closeCart: jest.fn()
}

jest.mock('../app/contexts/CartContext', () => ({
  useCart: () => mockCartContext
}))

describe('Demo Checkout Components', () => {
  describe('DemoModeIndicator', () => {
    test('should render demo mode indicator with correct information', () => {
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

  describe('DemoReceipt', () => {
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
      render(<DemoReceipt receipt={mockReceipt} order={mockOrder} />)
      
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
      render(<DemoReceipt receipt={mockReceipt} order={mockOrder} />)
      
      expect(screen.getByText('Demo Transaction Notice')).toBeInTheDocument()
      expect(screen.getByText(/This receipt is for demonstration purposes only/)).toBeInTheDocument()
      expect(screen.getByText(/No actual payment was processed/)).toBeInTheDocument()
    })

    test('should handle string dates correctly', () => {
      const receiptWithStringDate = {
        ...mockReceipt,
        timestamp: '2024-01-15T10:30:00Z'
      }
      
      const orderWithStringDate = {
        ...mockOrder,
        createdAt: '2024-01-15T10:30:00Z'
      }

      render(<DemoReceipt receipt={receiptWithStringDate} order={orderWithStringDate} />)
      
      expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument()
    })
  })

  describe('PaymentForm with Demo Mode', () => {
    const mockPaymentData = {
      type: 'card' as const,
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    }

    const mockPaymentInfo = {
      isDemo: true,
      supportedMethods: ['card'],
      demoInfo: {
        scenarios: [
          {
            name: 'Successful Payment',
            cardNumber: '4111111111111111',
            description: 'Standard Visa card that will process successfully',
            expectedResult: 'success'
          },
          {
            name: 'Card Declined',
            cardNumber: '4000000000000002',
            description: 'This card will always be declined',
            expectedResult: 'failure'
          }
        ]
      }
    }

    test('should show demo mode indicators when in demo mode', () => {
      render(
        <PaymentForm
          data={mockPaymentData}
          onChange={jest.fn()}
          onNext={jest.fn()}
          onPrev={jest.fn()}
          paymentInfo={mockPaymentInfo}
        />
      )
      
      expect(screen.getByText('Demo Mode - Quick Fill Options')).toBeInTheDocument()
      expect(screen.getByText('Demo Payment Processing')).toBeInTheDocument()
      expect(screen.getByText(/This is a demonstration/)).toBeInTheDocument()
    })

    test('should display demo scenarios for quick fill', () => {
      render(
        <PaymentForm
          data={mockPaymentData}
          onChange={jest.fn()}
          onNext={jest.fn()}
          onPrev={jest.fn()}
          paymentInfo={mockPaymentInfo}
        />
      )
      
      expect(screen.getByText('Successful Payment')).toBeInTheDocument()
      expect(screen.getByText('Card Declined')).toBeInTheDocument()
      expect(screen.getByText(/4111 1111 1111 1111/)).toBeInTheDocument()
      expect(screen.getByText(/4000 0000 0000 0002/)).toBeInTheDocument()
    })

    test('should auto-fill payment data when demo scenario is clicked', () => {
      const mockOnChange = jest.fn()
      
      render(
        <PaymentForm
          data={mockPaymentData}
          onChange={mockOnChange}
          onNext={jest.fn()}
          onPrev={jest.fn()}
          paymentInfo={mockPaymentInfo}
        />
      )
      
      // Click on the successful payment scenario
      fireEvent.click(screen.getByText('Successful Payment'))
      
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
        <PaymentForm
          data={mockPaymentData}
          onChange={jest.fn()}
          onNext={jest.fn()}
          onPrev={jest.fn()}
          paymentInfo={{ isDemo: false }}
        />
      )
      
      expect(screen.getByText('Secure Payment')).toBeInTheDocument()
      expect(screen.getByText(/Your payment information is encrypted/)).toBeInTheDocument()
      expect(screen.queryByText('Demo Payment Processing')).not.toBeInTheDocument()
    })
  })
})