import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyAuth } from '@/app/lib/auth-utils'
import { OrderStatus } from '@/app/lib/types'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = params
    const body = await request.json()
    const { reason } = body

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

    // Check if order can be cancelled
    const cancellableStatuses = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING
    ]

    if (!cancellableStatuses.includes(currentOrder.status as OrderStatus)) {
      return NextResponse.json(
        { error: `Cannot cancel order with status: ${currentOrder.status}` },
        { status: 400 }
      )
    }

    // Update order status to cancelled
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
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

    return NextResponse.json({
      success: true,
      order: transformedOrder,
      message: 'Order cancelled successfully'
    })
  } catch (error) {
    console.error('Error cancelling order:', error)
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    )
  }
}