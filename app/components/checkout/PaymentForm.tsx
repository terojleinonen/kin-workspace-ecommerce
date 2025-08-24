'use client'

import { useState } from 'react'
import { PaymentMethod } from '@/app/lib/checkout-types'
import { validateCardNumber, validateExpiryDate, formatCardNumber, formatExpiryDate } from '@/app/lib/checkout-utils'

interface PaymentFormProps {
  data: PaymentMethod
  onChange: (data: PaymentMethod) => void
  onNext: () => void
  onPrev: () => void
  paymentInfo?: any
}

export default function PaymentForm({ data, onChange, onNext, onPrev, paymentInfo }: PaymentFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: keyof PaymentMethod, value: string) => {
    let processedValue = value

    // Format card number and expiry date as user types
    if (field === 'cardNumber') {
      processedValue = formatCardNumber(value)
    } else if (field === 'expiryDate') {
      processedValue = formatExpiryDate(value)
    }

    onChange({ ...data, [field]: processedValue })
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (data.type === 'card') {
      if (!data.cardNumber?.trim()) {
        newErrors.cardNumber = 'Card number is required'
      } else if (!validateCardNumber(data.cardNumber)) {
        newErrors.cardNumber = 'Please enter a valid card number'
      }

      if (!data.expiryDate?.trim()) {
        newErrors.expiryDate = 'Expiry date is required'
      } else if (!validateExpiryDate(data.expiryDate)) {
        newErrors.expiryDate = 'Please enter a valid expiry date'
      }

      if (!data.cvv?.trim()) {
        newErrors.cvv = 'CVV is required'
      } else if (data.cvv.length < 3 || data.cvv.length > 4) {
        newErrors.cvv = 'CVV must be 3 or 4 digits'
      }

      if (!data.cardholderName?.trim()) {
        newErrors.cardholderName = 'Cardholder name is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onNext()
    }
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="font-satoshi font-bold text-2xl text-matte-black mb-6">
        Payment Information
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Method Selection */}
        <div>
          <label className="block font-satoshi font-medium text-matte-black mb-4">
            Payment Method
          </label>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-4 border border-warm-beige rounded-lg">
              <input
                type="radio"
                id="card"
                name="paymentType"
                value="card"
                checked={data.type === 'card'}
                onChange={(e) => onChange({ ...data, type: e.target.value as 'card' })}
                className="w-4 h-4 text-matte-black border-warm-beige focus:ring-matte-black"
              />
              <label htmlFor="card" className="font-satoshi font-medium text-matte-black">
                Credit/Debit Card
              </label>
              <div className="flex space-x-2 ml-auto">
                <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                  VISA
                </div>
                <div className="w-8 h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">
                  MC
                </div>
                <div className="w-8 h-5 bg-blue-800 rounded text-white text-xs flex items-center justify-center font-bold">
                  AMEX
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 border border-warm-beige rounded-lg opacity-50">
              <input
                type="radio"
                id="paypal"
                name="paymentType"
                value="paypal"
                disabled
                className="w-4 h-4 text-matte-black border-warm-beige focus:ring-matte-black"
              />
              <label htmlFor="paypal" className="font-satoshi font-medium text-slate-gray">
                PayPal (Coming Soon)
              </label>
            </div>
            
            <div className="flex items-center space-x-3 p-4 border border-warm-beige rounded-lg opacity-50">
              <input
                type="radio"
                id="apple_pay"
                name="paymentType"
                value="apple_pay"
                disabled
                className="w-4 h-4 text-matte-black border-warm-beige focus:ring-matte-black"
              />
              <label htmlFor="apple_pay" className="font-satoshi font-medium text-slate-gray">
                Apple Pay (Coming Soon)
              </label>
            </div>
          </div>
        </div>

        {/* Card Details */}
        {data.type === 'card' && (
          <>
            <div>
              <label className="block font-satoshi font-medium text-matte-black mb-2">
                Card Number *
              </label>
              <input
                type="text"
                value={data.cardNumber || ''}
                onChange={(e) => handleChange('cardNumber', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-matte-black ${
                  errors.cardNumber ? 'border-red-500' : 'border-warm-beige'
                }`}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />
              {errors.cardNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-satoshi font-medium text-matte-black mb-2">
                  Expiry Date *
                </label>
                <input
                  type="text"
                  value={data.expiryDate || ''}
                  onChange={(e) => handleChange('expiryDate', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-matte-black ${
                    errors.expiryDate ? 'border-red-500' : 'border-warm-beige'
                  }`}
                  placeholder="MM/YY"
                  maxLength={5}
                />
                {errors.expiryDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>
                )}
              </div>
              
              <div>
                <label className="block font-satoshi font-medium text-matte-black mb-2">
                  CVV *
                </label>
                <input
                  type="text"
                  value={data.cvv || ''}
                  onChange={(e) => handleChange('cvv', e.target.value.replace(/\D/g, ''))}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-matte-black ${
                    errors.cvv ? 'border-red-500' : 'border-warm-beige'
                  }`}
                  placeholder="123"
                  maxLength={4}
                />
                {errors.cvv && (
                  <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block font-satoshi font-medium text-matte-black mb-2">
                Cardholder Name *
              </label>
              <input
                type="text"
                value={data.cardholderName || ''}
                onChange={(e) => handleChange('cardholderName', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-matte-black ${
                  errors.cardholderName ? 'border-red-500' : 'border-warm-beige'
                }`}
                placeholder="Enter name as it appears on card"
              />
              {errors.cardholderName && (
                <p className="text-red-500 text-sm mt-1">{errors.cardholderName}</p>
              )}
            </div>
          </>
        )}

        {/* Demo Mode Quick Fill */}
        {paymentInfo?.isDemo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-satoshi font-semibold text-blue-900 mb-3">
              Demo Mode - Quick Fill Options
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {paymentInfo.demoInfo?.scenarios?.slice(0, 4).map((scenario: any, index: number) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    onChange({
                      ...data,
                      cardNumber: scenario.cardNumber,
                      expiryDate: '12/25',
                      cvv: '123',
                      cardholderName: 'Demo User'
                    })
                  }}
                  className="text-left p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <div className="font-medium text-blue-900 text-sm">{scenario.name}</div>
                  <div className="text-blue-700 text-xs mt-1">{scenario.description}</div>
                  <div className="text-blue-600 text-xs mt-1 font-mono">
                    {scenario.cardNumber.replace(/(\d{4})/g, '$1 ').trim()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className={`rounded-lg p-4 ${paymentInfo?.isDemo ? 'bg-blue-50 border border-blue-200' : 'bg-warm-beige/20'}`}>
          <div className="flex items-start space-x-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              paymentInfo?.isDemo ? 'bg-blue-600' : 'bg-matte-black'
            }`}>
              <span className="text-white text-xs">
                {paymentInfo?.isDemo ? '🎭' : '🔒'}
              </span>
            </div>
            <div>
              <h4 className={`font-satoshi font-semibold mb-1 ${
                paymentInfo?.isDemo ? 'text-blue-900' : 'text-matte-black'
              }`}>
                {paymentInfo?.isDemo ? 'Demo Payment Processing' : 'Secure Payment'}
              </h4>
              <p className={`text-sm ${
                paymentInfo?.isDemo ? 'text-blue-800' : 'text-slate-gray'
              }`}>
                {paymentInfo?.isDemo 
                  ? 'This is a demonstration. No real payment will be processed and no charges will be made to any card.'
                  : 'Your payment information is encrypted and secure. We never store your card details.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-4">
          <button
            type="button"
            onClick={onPrev}
            className="flex-1 btn-secondary py-3"
          >
            Back to Billing
          </button>
          <button
            type="submit"
            className="flex-1 btn-primary py-3"
          >
            Review Order
          </button>
        </div>
      </form>
    </div>
  )
}