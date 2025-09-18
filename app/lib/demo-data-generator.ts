import { PrismaClient } from '@prisma/client'
import { generateDemoOrderId, getDemoOrderStatuses } from './demo-utils'

const prisma = new PrismaClient()

export interface DemoDataOptions {
  userCount?: number
  orderCount?: number
  reviewCount?: number
  includeAdmin?: boolean
}

export async function generateDemoUsers(count: number = 3) {
  const users = []
  
  // Always include the main demo user
  users.push({
    id: 'demo-user-1',
    email: 'demo@kinworkspace.com',
    name: 'Demo Customer',
    password: 'hashed-demo-password',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  })

  // Generate additional demo users
  const names = [
    'Sarah Wilson', 'Michael Chen', 'Emma Rodriguez', 'James Thompson',
    'Lisa Park', 'David Kim', 'Rachel Green', 'Alex Johnson'
  ]

  for (let i = 1; i < count && i < names.length; i++) {
    const name = names[i]
    const firstName = name.split(' ')[0].toLowerCase()
    users.push({
      id: `demo-user-${i + 1}`,
      email: `${firstName}.demo@kinworkspace.com`,
      name: name,
      password: 'hashed-demo-password',
      createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
    })
  }

  return users
}

export async function generateDemoOrders(userIds: string[], count: number = 5) {
  const orders = []
  const statuses = getDemoOrderStatuses()
  
  const sampleProducts = [
    { id: 'ergonomic-desk-chair', name: 'Ergonomic Desk Chair', price: 299.99 },
    { id: 'standing-desk-converter', name: 'Standing Desk Converter', price: 149.99 },
    { id: 'desk-organizer-set', name: 'Desk Organizer Set', price: 89.99 },
    { id: 'monitor-arm-dual', name: 'Dual Monitor Arm', price: 179.99 },
    { id: 'wireless-charging-pad', name: 'Wireless Charging Pad', price: 49.99 },
    { id: 'desk-lamp-led', name: 'LED Desk Lamp', price: 79.99 },
  ]

  for (let i = 0; i < count; i++) {
    const userId = userIds[Math.floor(Math.random() * userIds.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const createdDaysAgo = Math.floor(Math.random() * 30) + 1
    
    // Generate 1-3 items per order
    const itemCount = Math.floor(Math.random() * 3) + 1
    const orderItems = []
    let total = 0
    
    for (let j = 0; j < itemCount; j++) {
      const product = sampleProducts[Math.floor(Math.random() * sampleProducts.length)]
      const quantity = Math.floor(Math.random() * 2) + 1
      const itemTotal = product.price * quantity
      
      orderItems.push({
        productId: product.id,
        quantity: quantity,
        price: product.price,
        total: itemTotal
      })
      
      total += itemTotal
    }

    orders.push({
      id: generateDemoOrderId(),
      userId: userId,
      status: status,
      total: total,
      subtotal: total,
      tax: 0,
      shipping: 0,
      items: orderItems,
      billingAddress: generateDemoAddress(userId),
      shippingAddress: generateDemoAddress(userId),
      createdAt: new Date(Date.now() - createdDaysAgo * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - (createdDaysAgo - 1) * 24 * 60 * 60 * 1000),
    })
  }

  return orders
}

export async function generateDemoReviews(userIds: string[], count: number = 8) {
  const reviews = []
  
  const productIds = [
    'ergonomic-desk-chair',
    'standing-desk-converter', 
    'desk-organizer-set',
    'monitor-arm-dual',
    'wireless-charging-pad',
    'desk-lamp-led'
  ]

  const reviewTemplates = [
    {
      rating: 5,
      title: 'Excellent quality and design',
      content: 'This product exceeded my expectations. The build quality is outstanding and it fits perfectly in my workspace setup.'
    },
    {
      rating: 4,
      title: 'Great value for money',
      content: 'Really happy with this purchase. Good quality materials and easy to set up. Would recommend to others.'
    },
    {
      rating: 5,
      title: 'Perfect for my home office',
      content: 'Exactly what I was looking for. The design is clean and modern, and it has improved my productivity significantly.'
    },
    {
      rating: 4,
      title: 'Solid construction, minor issues',
      content: 'Overall very satisfied with the product. Minor assembly issues but customer service was helpful.'
    },
    {
      rating: 5,
      title: 'Highly recommended!',
      content: 'This has been a game-changer for my workspace. The ergonomic design and quality materials make it worth every penny.'
    },
    {
      rating: 3,
      title: 'Good but could be better',
      content: 'Decent product for the price. Does what it says but there are some areas for improvement in the design.'
    },
    {
      rating: 5,
      title: 'Love the minimalist design',
      content: 'Beautiful product that matches perfectly with the Kin Workspace aesthetic. Functional and stylish.'
    },
    {
      rating: 4,
      title: 'Works as expected',
      content: 'No complaints here. Good quality product that delivers on its promises. Setup was straightforward.'
    }
  ]

  for (let i = 0; i < count && i < reviewTemplates.length; i++) {
    const template = reviewTemplates[i]
    const userId = userIds[Math.floor(Math.random() * userIds.length)]
    const productId = productIds[Math.floor(Math.random() * productIds.length)]
    const createdDaysAgo = Math.floor(Math.random() * 20) + 1

    reviews.push({
      id: `demo-review-${i + 1}`,
      userId: userId,
      productId: productId,
      rating: template.rating,
      title: template.title,
      content: template.content,
      verified: Math.random() > 0.3, // 70% verified
      helpful: Math.floor(Math.random() * 15),
      createdAt: new Date(Date.now() - createdDaysAgo * 24 * 60 * 60 * 1000),
    })
  }

  return reviews
}

function generateDemoAddress(userId: string) {
  const addresses = {
    'demo-user-1': {
      firstName: 'Demo',
      lastName: 'Customer',
      email: 'demo@kinworkspace.com',
      phone: '555-0123',
      address: '123 Demo Street',
      city: 'Demo City',
      state: 'CA',
      zipCode: '90210',
      country: 'US'
    },
    'demo-user-2': {
      firstName: 'Sarah',
      lastName: 'Wilson',
      email: 'sarah.demo@kinworkspace.com',
      phone: '555-0456',
      address: '456 Demo Avenue',
      city: 'Demo Town',
      state: 'NY',
      zipCode: '10001',
      country: 'US'
    }
  }

  return JSON.stringify(addresses[userId as keyof typeof addresses] || addresses['demo-user-1'])
}

export async function seedDemoData(options: DemoDataOptions = {}) {
  const {
    userCount = 3,
    orderCount = 5,
    reviewCount = 8,
    includeAdmin = true
  } = options

  try {
    // Generate users
    const users = await generateDemoUsers(userCount)
    if (includeAdmin) {
      users.push({
        id: 'demo-admin',
        email: 'admin@kinworkspace.com',
        name: 'Demo Admin',
        password: 'hashed-admin-password',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      })
    }

    // Create users in database
    for (const user of users) {
      await prisma.user.upsert({
        where: { email: user.email },
        update: user,
        create: user
      })
    }

    const userIds = users.map(u => u.id)

    // Generate and create orders
    const orders = await generateDemoOrders(userIds, orderCount)
    for (const order of orders) {
      await prisma.order.create({
        data: {
          id: order.id,
          userId: order.userId,
          status: order.status,
          total: order.total,
          subtotal: order.subtotal,
          tax: order.tax,
          shipping: order.shipping,
          billingAddress: order.billingAddress,
          shippingAddress: order.shippingAddress,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        }
      })
    }

    // Generate and create reviews
    const reviews = await generateDemoReviews(userIds, reviewCount)
    for (const review of reviews) {
      await prisma.review.upsert({
        where: { id: review.id },
        update: review,
        create: review
      })
    }

    return {
      success: true,
      data: {
        users: users.length,
        orders: orders.length,
        reviews: reviews.length
      }
    }
  } catch (error) {
    console.error('Error seeding demo data:', error)
    throw error
  }
}