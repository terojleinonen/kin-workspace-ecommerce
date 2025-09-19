import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyAuth } from '@/app/lib/auth-utils'
import { OrderFilters, OrdersResponse, OrderStatus, PaymentStatus } from '@/app/lib/types'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: any = {
      userId: authResult.user.id
    }

    // Add filters
    if (status) {
      where.status = status
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { items: { some: { product: { name: { contains: search, mode: 'insensitive' } } } } }
      ]
    }

    // Build order by clause
    let orderBy: any = {}
    switch (sortBy) {
      case 'total':
        orderBy.total = sortOrder
        break
      case 'status':
        orderBy.status = sortOrder
        break
      case 'date':
      default:
        orderBy.createdAt = sortOrder
        break
    }

    // Get total count for pagination
    const total = await prisma.order.count({ where })

    // Fetch orders with pagination
    const orders = await prisma.order.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                media: {
                  where: { isPrimary: true },
                  include: { media: true },
                  take: 1
                }
              }
            }
          }
        }
      }
    })

    // Transform the data to match our interface
    const transformedOrders = orders.map(order => ({
      ...order,
      status: order.status as OrderStatus,
      paymentStatus: order.paymentStatus as PaymentStatus,
      shippingAddress: order.shippingAddress as any,
      billingAddress: order.billingAddress as any,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      shipping: Number(order.shipping),
      items: order.items.map(item => ({
        ...item,
        price: Number(item.price),
        variant: item.variant as any,
        product: {
          ...item.product,
          image: item.product.media[0]?.media?.filename 
            ? `/uploads/${item.product.media[0].media.filename}`
            : '/images/placeholder.jpg'
        }
      }))
    }))

    const response: OrdersResponse = {
      orders: transformedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}