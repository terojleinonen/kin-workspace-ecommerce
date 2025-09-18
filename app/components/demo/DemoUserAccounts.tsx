'use client'

import { useState } from 'react'
import { EyeIcon, EyeSlashIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import { getDemoUserAccounts } from '@/app/lib/demo-utils'

export default function DemoUserAccounts() {
  const [showPasswords, setShowPasswords] = useState(false)
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null)
  
  const demoAccounts = getDemoUserAccounts()

  const copyToClipboard = async (text: string, accountId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedAccount(accountId)
      setTimeout(() => setCopiedAccount(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  
  if (!isDemoMode) {
    return null
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-satoshi font-bold text-blue-900 text-lg">
            Demo User Accounts
          </h3>
          <p className="text-blue-700 text-sm mt-1">
            Pre-configured accounts for testing different user scenarios
          </p>
        </div>
        <button
          onClick={() => setShowPasswords(!showPasswords)}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
        >
          {showPasswords ? (
            <EyeSlashIcon className="h-4 w-4" />
          ) : (
            <EyeIcon className="h-4 w-4" />
          )}
          <span>{showPasswords ? 'Hide' : 'Show'} Passwords</span>
        </button>
      </div>

      <div className="space-y-3">
        {demoAccounts.map((account, index) => (
          <div key={index} className="bg-white border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-satoshi font-semibold text-blue-900">
                  {account.name}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  account.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {account.role}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-blue-700 text-xs font-medium mb-1">
                  Email
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-blue-100 text-blue-900 px-2 py-1 rounded text-sm font-mono">
                    {account.email}
                  </code>
                  <button
                    onClick={() => copyToClipboard(account.email, `${index}-email`)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="Copy email"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  </button>
                  {copiedAccount === `${index}-email` && (
                    <span className="text-green-600 text-xs">Copied!</span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-blue-700 text-xs font-medium mb-1">
                  Password
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-blue-100 text-blue-900 px-2 py-1 rounded text-sm font-mono">
                    {showPasswords ? account.password : '••••••••'}
                  </code>
                  <button
                    onClick={() => copyToClipboard(account.password, `${index}-password`)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="Copy password"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  </button>
                  {copiedAccount === `${index}-password` && (
                    <span className="text-green-600 text-xs">Copied!</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick login button */}
            <div className="mt-3 pt-3 border-t border-blue-200">
              <button
                onClick={() => {
                  // Auto-fill login form if on login page
                  const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement
                  const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement
                  
                  if (emailInput && passwordInput) {
                    emailInput.value = account.email
                    passwordInput.value = account.password
                    
                    // Trigger change events
                    emailInput.dispatchEvent(new Event('input', { bubbles: true }))
                    passwordInput.dispatchEvent(new Event('input', { bubbles: true }))
                  } else {
                    // Navigate to login page with pre-filled data
                    const params = new URLSearchParams({
                      email: account.email,
                      demo: 'true'
                    })
                    window.location.href = `/login?${params.toString()}`
                  }
                }}
                className="w-full bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Quick Login as {account.name}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <span className="text-yellow-600 text-sm">⚠️</span>
          <div>
            <p className="text-yellow-800 text-sm font-medium">
              Demo Account Notice
            </p>
            <p className="text-yellow-700 text-xs mt-1">
              These accounts are for demonstration purposes only. In a production environment, 
              passwords would be securely hashed and not displayed in plain text.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}