'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/app/contexts/CartContext'
import { ShippingAddress, BillingAddress, PaymentMethod } from '@/app/lib/checkout-types'
import { calculateOrderSummary, generateOrderNumber, getEstimatedDelivery } from '@/app/lib/checkout-utils'
import ShippingForm from './ShippingForm'
import BillingForm from './BillingForm'
import PaymentForm from './PaymentForm'
import OrderSummary from './OrderSummary'
import DemoModeIndicator from './DemoModeIndicator'
import { useRouter } from 'next/navigation'

export default function CheckoutForm() {
  const { cart, clearCart } = useCart()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const [shippingData, setShippingData] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  })

  const [billingData, setBillingData] = useState<BillingAddress>({
    ...shippingData,
    sameAsShipping: true
  })

  const [paymentData, setPaymentData] = useState<PaymentMethod>({
    type: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  })

  const orderSummary = calculateOrderSummary(cart)

  const steps = [
    { number: 1, title: 'Shipping', completed: currentStep > 1 },
    { number: 2, title: 'Billing', completed: currentStep > 2 },
    { number: 3, title: 'Payment', completed: currentStep > 3 },
    { number: 4, title: 'Review', completed: false }
  ]

  // Fetch payment info on component mount
  useEffect(() => {
    const fetchPaymentInfo = async () => {
      try {
        const response = await fetch('/api/payment/process')
        if (response.ok) {
          const data = await response.json()
          setPaymentInfo(data)
        }
      } catch (error) {
        console.error('Failed to fetch payment info:', error)
      }
    }
    
    fetchPaymentInfo()
  }, [])

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handlePlaceOrder = async () => {
    setIsProcessing(true)
    setError(null)
    
    try {
      // Get auth token from localStorage (in a real app, this would be from auth context)
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('Please log in to complete your order')
      }

      // Prepare cart items for API
      const cartItems = cart.items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        variant: null // Add variant support if needed
      }))

      // Process payment through API
      const response = await fetch('/api/payment/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: orderSummary.total,
          paymentMethod: paymentData,
          shippingAddress: shippingData,
          billingAddress: billingData,
          cartItems,
          orderSummary
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Payment failed')
      }

      if (result.success) {
        // Store order data for success page
        const orderData = {
          ...result.order,
          receipt: result.receipt,
          isDemoTransaction: result.isDemoTransaction
        }
        
        localStorage.setItem('lastOrder', JSON.stringify(orderData))
        
        // Clear cart and redirect to success page
        clearCart()
        router.push(`/checkout/success?order=${result.order.id}`)
      } else {
        throw new Error(result.message || 'Payment failed')
      }
      
    } catch (error) {
      console.error('Order processing failed:', error)
      setError(error instanceof Error ? error.message : 'An error occurred while processing your order')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Demo Mode Indicator */}
      {paymentInfo?.isDemo && <DemoModeIndicator />}
      
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}
      
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step.completed || currentStep === step.number
                  ? 'bg-matte-black border-matte-black text-soft-white'
                  : 'border-warm-beige text-slate-gray'
              }`}>
                {step.completed ? '✓' : step.number}
              </div>
              <span className={`ml-2 font-satoshi font-medium ${
                step.completed || currentStep === step.number
                  ? 'text-matte-black'
                  : 'text-slate-gray'
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  step.completed ? 'bg-matte-black' : 'bg-warm-beige'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          {currentStep === 1 && (
            <ShippingForm
              data={shippingData}
              onChange={setShippingData}
              onNext={handleNextStep}
            />
          )}
          
          {currentStep === 2 && (
            <BillingForm
              shippingData={shippingData}
              data={billingData}
              onChange={setBillingData}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
            />
          )}
          
          {currentStep === 3 && (
            <PaymentForm
              data={paymentData}
              onChange={setPaymentData}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
              paymentInfo={paymentInfo}
            />
          )}
          
          {currentStep === 4 && (
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="font-satoshi font-bold text-2xl text-matte-black mb-6">
                Review Your Order
              </h2>
              
              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border border-warm-beige rounded-lg">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-satoshi font-medium text-matte-black">
                        {item.product.name}
                      </h3>
                      <p className="text-slate-gray text-sm">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <p className="font-satoshi font-semibold text-matte-black">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Shipping & Billing Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-satoshi font-semibold text-lg text-matte-black mb-3">
                    Shipping Address
                  </h3>
                  <div className="text-slate-gray text-sm space-y-1">
                    <p>{shippingData.firstName} {shippingData.lastName}</p>
                    <p>{shippingData.address}</p>
                    {shippingData.apartment && <p>{shippingData.apartment}</p>}
                    <p>{shippingData.city}, {shippingData.state} {shippingData.zipCode}</p>
                    <p>{shippingData.email}</p>
                    <p>{shippingData.phone}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-satoshi font-semibold text-lg text-matte-black mb-3">
                    Payment Method
                  </h3>
                  <div className="text-slate-gray text-sm">
                    <p>**** **** **** {paymentData.cardNumber?.slice(-4)}</p>
                    <p>{paymentData.cardholderName}</p>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 btn-secondary py-3"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : `Place Order - $${orderSummary.total.toFixed(2)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <OrderSummary cart={cart} orderSummary={orderSummary} />
        </div>
      </div>
    </div>
  )
}