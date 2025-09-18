import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getDemoModeConfig, generateDemoOrderId, getDemoOrderStatuses } from '@/app/lib/demo-utils'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Only allow in demo mode
    const config = getDemoModeConfig()
    if (!config.isDemoMode) {
      return NextResponse.json(
        { error: 'Demo reset only available in demo mode' },
        { status: 403 }
      )
    }

    // Clear existing demo data
    await prisma.$transaction(async (tx) => {
      // Delete demo orders and related data
      await tx.orderItem.deleteMany({
        where: {
          order: {
            id: {
              startsWith: 'DEMO-'
            }
          }
        }
      })
      
      await tx.order.deleteMany({
        where: {
          id: {
            startsWith: 'DEMO-'
          }
        }
      })

      // Delete demo reviews
      await tx.review.deleteMany({
        where: {
          userId: {
            startsWith: 'demo-user'
          }
        }
      })

      // Delete demo users (keep admin)
      await tx.user.deleteMany({
        where: {
          email: {
            startsWith: 'demo'
          },
          email: {
            not: 'admin@kinworkspace.com'
          }
        }
      })
    })

    // Generate fresh demo data
    await generateDemoData()

    return NextResponse.json({ 
      success: true, 
      message: 'Demo data reset successfully' 
    })
  } catch (error) {
    console.error('Error resetting demo data:', error)
    return NextResponse.json(
      { error: 'Failed to reset demo data' },
      { status: 500 }
    )
  }
}

async function generateDemoData() {
  // Create demo users
  const demoUsers = [
    {
      id: 'demo-user-1',
      email: 'demo@kinworkspace.com',
      name: 'Demo Customer',
      password: 'hashed-demo-password', // In real app, this would be properly hashed
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    },
    {
      id: 'demo-user-2', 
      email: 'sarah.demo@kinworkspace.com',
      name: 'Sarah Wilson',
      password: 'hashed-demo-password',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    },
    {
      id: 'demo-admin',
      email: 'admin@kinworkspace.com',
      name: 'Demo Admin',
      password: 'hashed-admin-password',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
    }
  ]

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: user,
      create: user
    })
  }

  // Create demo orders
  const demoOrders = [
    {
      id: generateDemoOrderId(),
      userId: 'demo-user-1',
      status: 'delivered',
      total: 299.99,
      subtotal: 299.99,
      tax: 0,
      shipping: 0,
      billingAddress: JSON.stringify({
        firstName: 'Demo',
        lastName: 'Customer', 
        email: 'demo@kinworkspace.com',
        phone: '555-0123',
        address: '123 Demo Street',
        city: 'Demo City',
        state: 'CA',
        zipCode: '90210',
        country: 'US'
      }),
      shippingAddress: JSON.stringify({
        firstName: 'Demo',
        lastName: 'Customer',
        address: '123 Demo Street',
        city: 'Demo City', 
        state: 'CA',
        zipCode: '90210',
        country: 'US'
      }),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
    {
      id: generateDemoOrderId(),
      userId: 'demo-user-1',
      status: 'shipped',
      total: 149.99,
      subtotal: 149.99,
      tax: 0,
      shipping: 0,
      billingAddress: JSON.stringify({
        firstName: 'Demo',
        lastName: 'Customer',
        email: 'demo@kinworkspace.com',
        phone: '555-0123',
        address: '123 Demo Street',
        city: 'Demo City',
        state: 'CA',
        zipCode: '90210',
        country: 'US'
      }),
      shippingAddress: JSON.stringify({
        firstName: 'Demo',
        lastName: 'Customer',
        address: '123 Demo Street',
        city: 'Demo City',
        state: 'CA',
        zipCode: '90210',
        country: 'US'
      }),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      id: generateDemoOrderId(),
      userId: 'demo-user-2',
      status: 'processing',
      total: 89.99,
      subtotal: 89.99,
      tax: 0,
      shipping: 0,
      billingAddress: JSON.stringify({
        firstName: 'Sarah',
        lastName: 'Wilson',
        email: 'sarah.demo@kinworkspace.com',
        phone: '555-0456',
        address: '456 Demo Avenue',
        city: 'Demo Town',
        state: 'NY',
        zipCode: '10001',
        country: 'US'
      }),
      shippingAddress: JSON.stringify({
        firstName: 'Sarah',
        lastName: 'Wilson',
        address: '456 Demo Avenue',
        city: 'Demo Town',
        state: 'NY',
        zipCode: '10001',
        country: 'US'
      }),
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    }
  ]

  for (const order of demoOrders) {
    await prisma.order.create({
      data: order
    })
  }

  // Create demo reviews
  const demoReviews = [
    {
      id: 'demo-review-1',
      userId: 'demo-user-1',
      productId: 'ergonomic-desk-chair',
      rating: 5,
      title: 'Excellent chair for long work sessions',
      content: 'This chair has completely transformed my home office setup. The ergonomic design provides excellent support during long coding sessions. Highly recommended!',
      verified: true,
      helpful: 12,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    },
    {
      id: 'demo-review-2',
      userId: 'demo-user-2',
      productId: 'standing-desk-converter',
      rating: 4,
      title: 'Great for switching between sitting and standing',
      content: 'Easy to adjust and sturdy construction. The height adjustment is smooth and it holds my dual monitor setup perfectly. Only wish it was slightly wider.',
      verified: true,
      helpful: 8,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
    {
      id: 'demo-review-3',
      userId: 'demo-user-1',
      productId: 'desk-organizer-set',
      rating: 5,
      title: 'Perfect for keeping workspace tidy',
      content: 'These organizers are beautifully crafted and fit perfectly on my desk. The bamboo material matches my other workspace accessories perfectly.',
      verified: true,
      helpful: 6,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    }
  ]

  for (const review of demoReviews) {
    await prisma.review.upsert({
      where: { id: review.id },
      update: review,
      create: review
    })
  }
}