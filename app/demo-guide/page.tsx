import DemoGuide from '../components/demo/DemoGuide'
import DemoUserAccounts from '../components/demo/DemoUserAccounts'
import { getDemoModeConfig } from '../lib/demo-utils'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Demo Guide - Kin Workspace',
  description: 'Learn how to use the Kin Workspace demo store and explore all features.',
}

export default function DemoGuidePage() {
  const config = getDemoModeConfig()
  
  // Redirect to home if not in demo mode
  if (!config.isDemoMode) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-soft-white pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 mb-4">
            <span className="text-4xl">🎭</span>
            <h1 className="font-satoshi font-bold text-4xl text-matte-black">
              Demo Guide
            </h1>
          </div>
          <p className="text-xl text-slate-gray max-w-2xl mx-auto">
            Welcome to the Kin Workspace demo! This guide will help you explore all the features 
            and understand how the e-commerce platform works.
          </p>
        </div>

        <div className="space-y-8">
          <DemoUserAccounts />
          <DemoGuide />
        </div>
      </div>
    </div>
  )
}