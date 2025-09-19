import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyAuth } from '@/app/lib/auth-utils'
import { OrderStatus } from '@/app/lib/types'

const prisma = new PrismaClient()

// Valid status transitions for demo purposes
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: []
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await params
    const body = await request.json()
    const { status, note } = body

    if (!status || !Object.values(OrderStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status provided' },
        { status: 400 }
      )
    }

    // Fetch current order
    const currentOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: authResult.user.id
      }
    })

    if (!currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if status transition is valid
    const validTransitions = VALID_TRANSITIONS[currentOrder.status as OrderStatus]
    if (!validTransitions.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${currentOrder.status} to ${status}` },
        { status: 400 }
      )
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        updatedAt: new Date()
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                media: {
                  include: { media: true },
                  orderBy: { sortOrder: 'asc' }
                }
              }
            }
          }
        }
      }
    })

    // Transform the data
    const transformedOrder = {
      ...updatedOrder,
      total: Number(updatedOrder.total),
      subtotal: Number(updatedOrder.subtotal),
      tax: Number(updatedOrder.tax),
      shipping: Number(updatedOrder.shipping),
      items: updatedOrder.items.map(item => ({
        ...item,
        price: Number(item.price),
        product: {
          ...item.product,
          image: item.product.media[0]?.media?.filename 
            ? `/uploads/${item.product.media[0].media.filename}`
            : '/images/placeholder.jpg'
        }
      }))
    }

    return NextResponse.json(transformedOrder)
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}