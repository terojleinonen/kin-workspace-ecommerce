'use client'

import { useState } from 'react'
import { QuestionMarkCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface DemoHelpProps {
  context?: 'checkout' | 'orders' | 'products' | 'general'
  className?: string
}

export default function DemoHelp({ context = 'general', className = '' }: DemoHelpProps) {
  const [isOpen, setIsOpen] = useState(false)

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  
  if (!isDemoMode) {
    return null
  }

  const getContextualHelp = () => {
    switch (context) {
      case 'checkout':
        return {
          title: 'Demo Checkout Help',
          content: [
            'Use demo credit card numbers to test different payment scenarios',
            'All payments are simulated - no real charges will be made',
            'Try different cards to see success and failure flows',
            'Orders created will appear in your demo order history'
          ],
          tips: [
            { label: 'Success Card', value: '4111 1111 1111 1111' },
            { label: 'Decline Card', value: '4000 0000 0000 0002' },
            { label: 'CVV', value: 'Any 3 digits (e.g., 123)' },
            { label: 'Expiry', value: 'Any future date (e.g., 12/25)' }
          ]
        }
      case 'orders':
        return {
          title: 'Demo Orders Help',
          content: [
            'View sample orders with different statuses',
            'Track order progress through various stages',
            'Try reordering items or canceling pending orders',
            'All order data is for demonstration purposes only'
          ],
          tips: [
            { label: 'Order Statuses', value: 'Pending, Processing, Shipped, Delivered' },
            { label: 'Demo Orders', value: 'Prefixed with "DEMO-" for identification' },
            { label: 'Reorder', value: 'Adds all items from order to current cart' },
            { label: 'Cancel', value: 'Only available for pending orders' }
          ]
        }
      case 'products':
        return {
          title: 'Demo Products Help',
          content: [
            'Browse our curated collection of workspace products',
            'Use filters to find products by category or price',
            'Read customer reviews and ratings',
            'Add items to cart or wishlist for later'
          ],
          tips: [
            { label: 'Reviews', value: 'Sample reviews from demo customers' },
            { label: 'Ratings', value: 'Based on aggregated demo review data' },
            { label: 'Wishlist', value: 'Save items for future purchase' },
            { label: 'Cart', value: 'Persistent across browser sessions' }
          ]
        }
      default:
        return {
          title: 'Demo Mode Help',
          content: [
            'You\'re viewing a demonstration of Kin Workspace',
            'All transactions and data are simulated for testing',
            'Explore features without any real-world consequences',
            'Use the demo guide for step-by-step scenarios'
          ],
          tips: [
            { label: 'Demo Guide', value: 'Complete walkthrough of all features' },
            { label: 'Sample Data', value: 'Pre-loaded orders, reviews, and users' },
            { label: 'Reset Data', value: 'Admin can reset to fresh demo state' },
            { label: 'No Real Charges', value: 'All payments are simulated' }
          ]
        }
    }
  }

  const helpData = getContextualHelp()

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm ${className}`}
        title="Demo Help"
      >
        <QuestionMarkCircleIcon className="h-4 w-4" />
        <span>Demo Help</span>
      </button>

      {/* Help Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600 text-lg">🎭</span>
                  <h3 className="font-satoshi font-bold text-lg text-matte-black">
                    {helpData.title}
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-gray hover:text-matte-black"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-satoshi font-medium text-matte-black mb-2">
                    What you can do:
                  </h4>
                  <ul className="space-y-1">
                    {helpData.content.map((item, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm text-slate-gray">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-satoshi font-medium text-matte-black mb-2">
                    Quick Reference:
                  </h4>
                  <div className="space-y-2">
                    {helpData.tips.map((tip, index) => (
                      <div key={index} className="flex justify-between items-start text-sm">
                        <span className="text-slate-gray font-medium">{tip.label}:</span>
                        <span className="text-matte-black font-mono text-xs ml-2 flex-1 text-right">
                          {tip.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-warm-beige">
                  <div className="flex space-x-3">
                    <Link
                      href="/demo-guide"
                      className="flex-1 bg-blue-600 text-white text-center py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      onClick={() => setIsOpen(false)}
                    >
                      Full Demo Guide
                    </Link>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="flex-1 border border-warm-beige text-matte-black py-2 px-3 rounded-lg hover:bg-warm-beige transition-colors text-sm font-medium"
                    >
                      Got It
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}