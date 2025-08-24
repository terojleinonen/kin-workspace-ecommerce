import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyAuth } from '@/app/lib/auth-utils'
import { OrderStatus } from '@/app/lib/types'

const prisma = new PrismaClient()

export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderIds, action, status } = body

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Order IDs are required' },
        { status: 400 }
      )
    }

    if (!action || !['updateStatus', 'cancel'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Verify all orders belong to the user
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        userId: authResult.user.id
      }
    })

    if (orders.length !== orderIds.length) {
      return NextResponse.json(
        { error: 'Some orders not found or unauthorized' },
        { status: 404 }
      )
    }

    let updateData: any = { updatedAt: new Date() }
    let results: any[] = []

    switch (action) {
      case 'updateStatus':
        if (!status || !Object.values(OrderStatus).includes(status)) {
          return NextResponse.json(
            { error: 'Valid status is required for updateStatus action' },
            { status: 400 }
          )
        }

        // Validate status transitions for each order
        for (const order of orders) {
          // Add validation logic here if needed
          // For demo purposes, we'll allow most transitions
        }

        updateData.status = status
        break

      case 'cancel':
        // Check if orders can be cancelled
        const uncancellableOrders = orders.filter(order => 
          !['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status)
        )

        if (uncancellableOrders.length > 0) {
          return NextResponse.json(
            { 
              error: 'Some orders cannot be cancelled',
              uncancellableOrderIds: uncancellableOrders.map(o => o.id)
            },
            { status: 400 }
          )
        }

        updateData.status = OrderStatus.CANCELLED
        break
    }

    // Perform bulk update
    const updateResult = await prisma.order.updateMany({
      where: {
        id: { in: orderIds },
        userId: authResult.user.id
      },
      data: updateData
    })

    // Fetch updated orders
    const updatedOrders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        userId: authResult.user.id
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
    const transformedOrders = updatedOrders.map(order => ({
      ...order,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      shipping: Number(order.shipping),
      items: order.items.map(item => ({
        ...item,
        price: Number(item.price),
        product: {
          ...item.product,
          image: item.product.media[0]?.media?.filename 
            ? `/uploads/${item.product.media[0].media.filename}`
            : '/images/placeholder.jpg'
        }
      }))
    }))

    return NextResponse.json({
      success: true,
      updatedCount: updateResult.count,
      orders: transformedOrders,
      message: `Successfully ${action === 'cancel' ? 'cancelled' : 'updated'} ${updateResult.count} orders`
    })
  } catch (error) {
    console.error('Error performing bulk operation:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}