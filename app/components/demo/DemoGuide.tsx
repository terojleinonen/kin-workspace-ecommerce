'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ShoppingCartIcon, 
  CreditCardIcon, 
  TruckIcon, 
  StarIcon,
  UserIcon,
  Cog6ToothIcon,
  ChevronRightIcon,
  PlayIcon
} from '@heroicons/react/24/outline'

interface DemoScenario {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  steps: string[]
  link: string
  duration: string
}

export default function DemoGuide() {
  const [activeScenario, setActiveScenario] = useState<string | null>(null)

  const scenarios: DemoScenario[] = [
    {
      id: 'shopping',
      title: 'Complete Shopping Experience',
      description: 'Experience the full customer journey from browsing products to completing an order.',
      icon: ShoppingCartIcon,
      duration: '5-7 minutes',
      link: '/shop',
      steps: [
        'Browse the product catalog and use filters',
        'Add items to your cart and adjust quantities',
        'Proceed to checkout and enter shipping information',
        'Use demo payment cards to complete the purchase',
        'View your order confirmation and receipt'
      ]
    },
    {
      id: 'payment',
      title: 'Payment Processing Demo',
      description: 'Test different payment scenarios including success and failure cases.',
      icon: CreditCardIcon,
      duration: '3-5 minutes',
      link: '/cart',
      steps: [
        'Add any product to your cart',
        'Go to checkout and fill in billing information',
        'Try different demo credit card numbers',
        'Experience success and failure payment flows',
        'See how errors are handled gracefully'
      ]
    },
    {
      id: 'orders',
      title: 'Order Management',
      description: 'Explore order history, tracking, and management features.',
      icon: TruckIcon,
      duration: '3-4 minutes',
      link: '/orders',
      steps: [
        'Log in with a demo account that has order history',
        'Browse orders with different statuses',
        'View detailed order information',
        'Track order progress with status timeline',
        'Try reordering or canceling orders'
      ]
    },
    {
      id: 'reviews',
      title: 'Product Reviews System',
      description: 'See how customers can leave and interact with product reviews.',
      icon: StarIcon,
      duration: '2-3 minutes',
      link: '/product/ergonomic-desk-chair',
      steps: [
        'Visit any product page',
        'Read existing customer reviews',
        'Leave your own review with rating',
        'Mark reviews as helpful',
        'See how reviews affect product ratings'
      ]
    },
    {
      id: 'account',
      title: 'User Account Features',
      description: 'Explore user registration, login, and profile management.',
      icon: UserIcon,
      duration: '2-3 minutes',
      link: '/login',
      steps: [
        'Try logging in with demo credentials',
        'Create a new demo account',
        'Update profile information',
        'Manage wishlist items',
        'View account order history'
      ]
    },
    {
      id: 'admin',
      title: 'Admin & CMS Features',
      description: 'Explore administrative features and content management.',
      icon: Cog6ToothIcon,
      duration: '4-5 minutes',
      link: '/admin/cms',
      steps: [
        'Log in with admin demo credentials',
        'Access the CMS management dashboard',
        'Sync products from external CMS',
        'View sync history and status',
        'Manage demo data and reset functionality'
      ]
    }
  ]

  const toggleScenario = (scenarioId: string) => {
    setActiveScenario(activeScenario === scenarioId ? null : scenarioId)
  }

  return (
    <div className="bg-white rounded-lg border border-warm-beige p-6">
      <div className="mb-6">
        <h2 className="font-satoshi font-bold text-2xl text-matte-black mb-2">
          Demo Scenarios
        </h2>
        <p className="text-slate-gray">
          Choose a scenario to explore different aspects of the Kin Workspace platform. 
          Each scenario includes step-by-step instructions and estimated completion time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map((scenario) => {
          const Icon = scenario.icon
          const isActive = activeScenario === scenario.id

          return (
            <div key={scenario.id} className="border border-warm-beige rounded-lg overflow-hidden">
              <button
                onClick={() => toggleScenario(scenario.id)}
                className="w-full p-4 text-left hover:bg-warm-beige/10 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-matte-black rounded-lg flex items-center justify-center">
                    <Icon className="h-5 w-5 text-soft-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-satoshi font-semibold text-matte-black">
                        {scenario.title}
                      </h3>
                      <ChevronRightIcon 
                        className={`h-5 w-5 text-slate-gray transition-transform ${
                          isActive ? 'rotate-90' : ''
                        }`} 
                      />
                    </div>
                    <p className="text-slate-gray text-sm mt-1">
                      {scenario.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-slate-gray">
                        ⏱️ {scenario.duration}
                      </span>
                      <span className="text-xs text-slate-gray">
                        📋 {scenario.steps.length} steps
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {isActive && (
                <div className="border-t border-warm-beige bg-warm-beige/5 p-4">
                  <div className="mb-4">
                    <h4 className="font-satoshi font-medium text-matte-black mb-2">
                      Step-by-step instructions:
                    </h4>
                    <ol className="space-y-2">
                      {scenario.steps.map((step, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm text-slate-gray">
                          <span className="flex-shrink-0 w-5 h-5 bg-matte-black text-soft-white rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  
                  <Link
                    href={scenario.link}
                    className="inline-flex items-center space-x-2 bg-matte-black text-soft-white px-4 py-2 rounded-lg hover:bg-slate-gray transition-colors text-sm font-medium"
                  >
                    <PlayIcon className="h-4 w-4" />
                    <span>Start This Scenario</span>
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick Tips */}
      <div className="mt-8 pt-6 border-t border-warm-beige">
        <h3 className="font-satoshi font-semibold text-matte-black mb-4">
          Quick Tips for Demo Exploration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💳 Demo Payment Cards</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div><strong>Success:</strong> 4111 1111 1111 1111</div>
              <div><strong>Decline:</strong> 4000 0000 0000 0002</div>
              <div><strong>Insufficient Funds:</strong> 4000 0000 0000 9995</div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">👤 Demo Accounts</h4>
            <div className="text-sm text-green-800 space-y-1">
              <div><strong>Customer:</strong> demo@kinworkspace.com</div>
              <div><strong>Admin:</strong> admin@kinworkspace.com</div>
              <div><strong>Password:</strong> demo123 / admin123</div>
            </div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-2">🔄 Reset Demo Data</h4>
            <p className="text-sm text-purple-800">
              Use the admin panel to reset all demo data and start fresh with new sample orders and reviews.
            </p>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-medium text-orange-900 mb-2">🎭 Demo Mode</h4>
            <p className="text-sm text-orange-800">
              All transactions are simulated. No real payments are processed and no actual orders are placed.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="mt-8 pt-6 border-t border-warm-beige">
        <h3 className="font-satoshi font-semibold text-matte-black mb-4">
          Key Features to Explore
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-matte-black rounded-lg flex items-center justify-center mx-auto mb-3">
              <ShoppingCartIcon className="h-6 w-6 text-soft-white" />
            </div>
            <h4 className="font-satoshi font-medium text-matte-black mb-2">
              Smart Shopping Cart
            </h4>
            <p className="text-sm text-slate-gray">
              Persistent cart, quantity updates, and seamless checkout flow
            </p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-matte-black rounded-lg flex items-center justify-center mx-auto mb-3">
              <CreditCardIcon className="h-6 w-6 text-soft-white" />
            </div>
            <h4 className="font-satoshi font-medium text-matte-black mb-2">
              Payment Processing
            </h4>
            <p className="text-sm text-slate-gray">
              Demo payment system with realistic success and failure scenarios
            </p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-matte-black rounded-lg flex items-center justify-center mx-auto mb-3">
              <TruckIcon className="h-6 w-6 text-soft-white" />
            </div>
            <h4 className="font-satoshi font-medium text-matte-black mb-2">
              Order Tracking
            </h4>
            <p className="text-sm text-slate-gray">
              Complete order management with status updates and history
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}